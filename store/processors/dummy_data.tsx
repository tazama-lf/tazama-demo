import { Conditions } from "./processor.interface"

export const mock_con: Conditions[] = [
  {
    condTp: "override",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "both",
    incptnDtTm: "2025-01-01T12:00:00.000Z",
    xprtnDtTm: "2025-03-26T12:00:00.000Z",
    ntty: {
      id: "07c421114cf64605b1c7febd79226d95",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "overridable-block",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "Debtor",
    incptnDtTm: "2025-01-01T12:00:00.000Z",
    xprtnDtTm: null,
    ntty: {
      id: "07c421114cf64605b1c7febd79226d95",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "non-overridable-block",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "Creditor",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: null,
    ntty: {
      id: "d4b7bf7c964348ccbbbc8c3142fe864e",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "override",
    condRsn: "Phishing of Account takeover",
    evtTp: ["all"],
    prsptv: "both",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: "2025-03-25T16:12:00.000",
    ntty: {
      id: "7f89603cf79846c395298efcb534a71d",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "override",
    condRsn: "Phishing of Account takeover",
    evtTp: ["all"],
    prsptv: "both",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: null,
    acct: {
      id: "9767a8a912dd49e3b178fc7f08e155d9",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "MSISDN",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "non-overridable-block",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "Creditor",
    incptnDtTm: "2025-03-05T13:00:00.000Z",
    xprtnDtTm: "2025-03-05T13:01:00.000Z",
    acct: {
      id: "9767a8a912dd49e3b178fc7f08e155d9",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "MSISDN",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["all"],
    condTp: "overridable-block",
    prsptv: "debtor",
    incptnDtTm: "2025-03-05T13:02:00.000Z",
    xprtnDtTm: null,
    condRsn: "Suspicion of Money Laundering",
    acct: {
      id: "93826471f87d4840a1e84ff7806d7936",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "non-overridable-block",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "Creditor",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: "2025-02-01T12:00:00.000",
    acct: {
      id: "9c9cf5f1322a41c8b3162cb723a90f45",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "MSISDN",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["pacs.008.001.10", "pacs.002.001.12"],
    condTp: "override",
    prsptv: "both",
    incptnDtTm: "2025-03-03T14:00:00.000",
    xprtnDtTm: null,
    condRsn: "Violation of KYC/AML Requirements",
    acct: {
      id: "dd04401057bb4b7d9d73bd8923d70934",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["all"],
    condTp: "override",
    prsptv: "debtor",
    incptnDtTm: "2025-03-04T20:22:00+0200",
    xprtnDtTm: null,
    condRsn: "Tax Evasion Concerns",
    acct: {
      id: "0bf53a378fec4c5da3ffbc8818d16b1d",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["all"],
    condTp: "overridable-block",
    prsptv: "debtor",
    incptnDtTm: "2025-03-05T12:24:00.000Z",
    xprtnDtTm: null,
    condRsn: "Tax Evasion Concerns",
    ntty: {
      id: "7f89603cf79846c395298efcb534a71d",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["pacs.008.001.10", "pacs.002.001.12"],
    condTp: "override",
    prsptv: "debtor",
    incptnDtTm: "2025-03-05T12:48:00.000Z",
    xprtnDtTm: null,
    condRsn: "Violation of KYC/AML Requirements",
    acct: {
      id: "6ef2c50366c545a0a9f0d47b3c39730c",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["pacs.008.001.10", "pacs.002.001.12"],
    condTp: "overridable-block",
    prsptv: "both",
    incptnDtTm: "2025-03-05T12:49:00.000Z",
    xprtnDtTm: null,
    condRsn: "Tax Evasion Concerns",
    acct: {
      id: "6ef2c50366c545a0a9f0d47b3c39730c",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["pacs.008.001.10", "pacs.002.001.12"],
    condTp: "overridable-block",
    prsptv: "debtor",
    incptnDtTm: "2025-03-05T13:09:00.000Z",
    xprtnDtTm: null,
    condRsn: "High-Risk Countries",
    acct: {
      id: "c540db8001304c15af02ee8f6198f2c6",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["all"],
    condTp: "override",
    prsptv: "both",
    incptnDtTm: "2025-03-05T13:43:00.000Z",
    xprtnDtTm: "2025-03-06T13:43:00.000Z",
    condRsn: "Exceeding Limits",
    acct: {
      id: "c540db8001304c15af02ee8f6198f2c6",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    evtTp: ["pacs.002.001.12", "pacs.008.001.10", "pain.001.001.13", "pain.013.001.09"],
    condTp: "non-overridable-block",
    prsptv: "debtor",
    incptnDtTm: "2025-03-05T14:04:00.000Z",
    xprtnDtTm: null,
    condRsn: "Violation of KYC/AML Requirements",
    acct: {
      id: "c540db8001304c15af02ee8f6198f2c6",
      schmeNm: {
        prtry: "MSISDN",
      },
      agt: {
        finInstnId: {
          clrSysMmbId: {
            mmbId: "fsp001",
          },
        },
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
]
