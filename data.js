window.PREGNANCY_DATA = (() => {
  const reviewedAt = "2026-07-05";

  const sources = {
    pregnancyVoucher: "https://www.gov.kr/portal/service/serviceInfo/SD0000007672",
    easyLawMaternity:
      "https://www.easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=5&cnpClsNo=1&csmSeq=735&popMenu=ov",
    pregnancyOneStop: "https://www.gov.kr/portal/onestopSvc/fertility",
    ktxBenefit: "https://www.gov.kr/portal/service/serviceInfo/B55145700016",
    postpartumHelper: "https://www.gov.kr/portal/service/serviceInfo/PTR000050390",
  };

  const milestones = [
    {
      id: "voucher-apply",
      type: "pregnancy_week",
      week: 5,
      category: "benefit",
      title: "국민행복카드·진료비 지원 신청",
      shortTitle: "국민행복카드 신청",
      summary: "임신 확인 뒤 가능한 빠르게 건강보험 임신·출산 진료비 지원을 신청합니다.",
      details:
        "정부24 기준 임신 1회당 100만 원, 다태아는 140만 원 기본지급이며 다태아는 태아당 100만 원이 되도록 추가지원됩니다. 카드 발급과 지원 신청을 같이 처리하면 일정 관리가 쉽습니다.",
      why: "임신 확인 뒤 가장 먼저 챙길 공적 지원이라 초기에 배치했습니다.",
      sourceLabel: "정부24 건강보험 임신·출산 진료비 지원",
      href: sources.pregnancyVoucher,
      official: true,
    },
    {
      id: "one-stop-apply",
      type: "pregnancy_week",
      week: 5,
      category: "benefit",
      title: "맘편한 임신 원스톱 신청",
      shortTitle: "맘편한 임신 신청",
      summary: "정부24 맘편한 임신에서 임신 관련 지원을 한 번에 확인하고 신청합니다.",
      details:
        "엽산제, 철분제, 표준모자보건수첩, 맘편한 KTX, SRT 임산부 할인, 에너지바우처 등 연계 가능한 서비스를 한 화면에서 확인할 수 있습니다. 실제 제공 항목은 거주지와 자격에 따라 달라집니다.",
      why: "여러 혜택을 따로 찾기 전에 한 번에 묶어서 확인하는 출발점입니다.",
      sourceLabel: "정부24 맘편한 임신",
      href: sources.pregnancyOneStop,
      official: true,
    },
    {
      id: "work-short-early",
      type: "pregnancy_week",
      week: 5,
      category: "work",
      title: "임신기 근로시간 단축 가능 여부 확인",
      shortTitle: "근로시간 단축 검토",
      summary: "재직 중이라면 12주 이내 사용 가능한 임신기 근로시간 단축을 초기에 검토합니다.",
      details:
        "찾기쉬운 생활법령 기준 임신 후 12주 이내 또는 32주 이후 여성근로자는 1일 2시간 근로시간 단축을 신청할 수 있고, 사용자는 이를 이유로 임금을 삭감할 수 없습니다.",
      why: "초기 구간은 12주 이내로 짧아서 놓치기 쉬운 권리입니다.",
      sourceLabel: "찾기쉬운 생활법령정보",
      href: sources.easyLawMaternity,
      official: true,
      audience: "재직자",
    },
    {
      id: "rail-register",
      type: "pregnancy_week",
      week: 8,
      category: "benefit",
      title: "맘편한 KTX·SRT 등록",
      shortTitle: "KTX·SRT 등록",
      summary: "철도 이용 계획이 있다면 임산부 할인 등록을 미리 끝냅니다.",
      details:
        "정부24 기준 KTX는 출산예정일 + 1년까지 특실·우등실 요금 면제 또는 일반실 운임 할인, SRT는 지정 좌석 운임 할인이 적용됩니다. 실제 조건은 예매 수량과 노선에 따라 다를 수 있습니다.",
      why: "임신 확인 뒤 증빙이 준비되면 바로 등록할 수 있는 혜택입니다.",
      sourceLabel: "정부24 맘편한 코레일",
      href: sources.ktxBenefit,
      official: true,
    },
    {
      id: "work-short-late",
      type: "pregnancy_week",
      week: 32,
      category: "work",
      title: "32주 이후 근로시간 단축 재확인",
      shortTitle: "32주 단축 확인",
      summary: "32주 이후 다시 사용할 수 있는 임신기 근로시간 단축 여부를 확인합니다.",
      details:
        "초기 12주 구간을 넘겼더라도 32주 이후에는 다시 법정 신청 가능 구간이 열립니다. 회사 서식과 제출 시점을 미리 확인해 두는 편이 안전합니다.",
      why: "법상 가능 시점이 다시 열리는 기준 주차입니다.",
      sourceLabel: "찾기쉬운 생활법령정보",
      href: sources.easyLawMaternity,
      official: true,
      audience: "재직자",
    },
    {
      id: "postpartum-helper",
      type: "due_days_before",
      days: 40,
      category: "benefit",
      title: "산모·신생아 건강관리 지원 신청 준비",
      shortTitle: "산후도우미 신청",
      summary: "출산 전부터 산모·신생아 건강관리 지원 신청 일정을 잡습니다.",
      details:
        "정부24 기준 출산예정일 40일 전부터 출산일로부터 30일까지 신청할 수 있습니다. 복지로와 보건소 접수 방식, 소득기준, 필요서류가 지자체별로 다를 수 있어 사전 준비가 필요합니다.",
      why: "공식 신청 가능 시작점이 출산예정일 40일 전이기 때문입니다.",
      sourceLabel: "정부24 산모·신생아 건강관리 지원",
      href: sources.postpartumHelper,
      official: true,
    },
  ];

  return {
    reviewedAt,
    sources,
    milestones,
  };
})();
