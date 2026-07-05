import { BlobNotFoundError, BlobPreconditionFailedError, get, put } from "@vercel/blob";

const SHARED_STATE_PATH = "shared-checklist/deogyang-couple-2026-05-23.json";

function jsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  if (payload?.etag) {
    headers.set("etag", payload.etag);
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

function createDefaultState() {
  return {
    doneIds: [],
    updatedAt: null,
    updatedBy: null,
    version: 0,
  };
}

function normalizeState(raw) {
  const doneIds = Array.isArray(raw?.doneIds)
    ? [...new Set(raw.doneIds.filter((value) => typeof value === "string"))]
    : [];

  return {
    doneIds: doneIds.sort(),
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : null,
    updatedBy: typeof raw?.updatedBy === "string" ? raw.updatedBy : null,
    version: Number.isInteger(raw?.version) ? raw.version : 0,
  };
}

function isSyncConfigured() {
  return Boolean(
    (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) &&
      process.env.SHARED_CHECKLIST_CODE,
  );
}

function isSharedCodeValid(request) {
  const expectedCode = process.env.SHARED_CHECKLIST_CODE ?? "";
  const providedCode = request.headers.get("x-shared-code") ?? "";
  return Boolean(expectedCode) && providedCode === expectedCode;
}

function unauthorizedResponse() {
  return jsonResponse(
    {
      error: "sync_unauthorized",
      message: "공유 코드가 올바르지 않습니다.",
    },
    { status: 401 },
  );
}

async function readSharedState(ifNoneMatch) {
  try {
    const result = await get(SHARED_STATE_PATH, {
      access: "private",
      ifNoneMatch,
    });

    if (result === null) {
      return {
        status: 200,
        etag: "",
        state: createDefaultState(),
      };
    }

    if (result.statusCode === 304) {
      return {
        status: 304,
        etag: result.blob?.etag ?? "",
        state: null,
      };
    }

    const text = await new Response(result.stream).text();
    const parsed = text ? JSON.parse(text) : {};

    return {
      status: 200,
      etag: result.blob?.etag ?? "",
      state: normalizeState(parsed),
    };
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return {
        status: 200,
        etag: "",
        state: createDefaultState(),
      };
    }
    throw error;
  }
}

function validateOperation(operation) {
  if (operation?.type === "reset") {
    return {
      type: "reset",
      deviceId:
        typeof operation.deviceId === "string" && operation.deviceId.trim()
          ? operation.deviceId.trim()
          : "shared-device",
    };
  }

  if (
    operation?.type === "set" &&
    typeof operation.taskId === "string" &&
    typeof operation.checked === "boolean"
  ) {
    return {
      type: "set",
      taskId: operation.taskId,
      checked: operation.checked,
      deviceId:
        typeof operation.deviceId === "string" && operation.deviceId.trim()
          ? operation.deviceId.trim()
          : "shared-device",
    };
  }

  return null;
}

function applyOperation(state, operation) {
  const nextDoneIds = new Set(state.doneIds);

  if (operation.type === "reset") {
    nextDoneIds.clear();
  }

  if (operation.type === "set") {
    if (operation.checked) {
      nextDoneIds.add(operation.taskId);
    } else {
      nextDoneIds.delete(operation.taskId);
    }
  }

  return {
    doneIds: [...nextDoneIds].sort(),
    updatedAt: new Date().toISOString(),
    updatedBy: operation.deviceId,
    version: state.version + 1,
  };
}

export async function GET(request) {
  if (!isSyncConfigured()) {
    return jsonResponse(
      {
        error: "sync_not_configured",
        message: "Vercel Blob 저장소가 아직 연결되지 않았습니다.",
      },
      { status: 503 },
    );
  }

  if (!isSharedCodeValid(request)) {
    return unauthorizedResponse();
  }

  try {
    const result = await readSharedState(request.headers.get("if-none-match") ?? undefined);

    if (result.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          "cache-control": "no-store",
          etag: result.etag,
        },
      });
    }

    return jsonResponse(
      {
        ...result.state,
        etag: result.etag,
      },
      {
        status: 200,
        headers: result.etag ? { etag: result.etag } : undefined,
      },
    );
  } catch (error) {
    return jsonResponse(
      {
        error: "sync_read_failed",
        message: "공유 체크 상태를 읽지 못했습니다.",
        detail: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  if (!isSyncConfigured()) {
    return jsonResponse(
      {
        error: "sync_not_configured",
        message: "Vercel Blob 저장소가 아직 연결되지 않았습니다.",
      },
      { status: 503 },
    );
  }

  if (!isSharedCodeValid(request)) {
    return unauthorizedResponse();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "invalid_json",
        message: "요청 형식이 올바르지 않습니다.",
      },
      { status: 400 },
    );
  }

  const operation = validateOperation(body);
  if (!operation) {
    return jsonResponse(
      {
        error: "invalid_operation",
        message: "지원하지 않는 체크 동기화 요청입니다.",
      },
      { status: 400 },
    );
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await readSharedState();
    const nextState = applyOperation(current.state ?? createDefaultState(), operation);

    try {
      const saved = await put(SHARED_STATE_PATH, JSON.stringify(nextState), {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json; charset=utf-8",
        cacheControlMaxAge: 0,
        ifMatch: current.etag || undefined,
      });

      return jsonResponse(
        {
          ...nextState,
          etag: saved.etag ?? "",
        },
        {
          status: 200,
          headers: saved.etag ? { etag: saved.etag } : undefined,
        },
      );
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        continue;
      }

      return jsonResponse(
        {
          error: "sync_write_failed",
          message: "공유 체크 상태를 저장하지 못했습니다.",
          detail: error instanceof Error ? error.message : "unknown_error",
        },
        { status: 500 },
      );
    }
  }

  return jsonResponse(
    {
      error: "sync_conflict",
      message: "동시에 수정되어 다시 시도해야 합니다.",
    },
    { status: 409 },
  );
}
