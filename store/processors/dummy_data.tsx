import { Conditions } from "./processor.interface"

export const mock_con: Conditions[] = [
  {
    condTp: "override",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "both",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: "2025-03-26T12:00:00.000",
    ntty: {
      id: "6ef2c50366c545a0a9f0d47b3c39730c",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "overridable block",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "Debtor",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: null,
    ntty: {
      id: "6ef2c50366c545a0a9f0d47b3c39730c",
      schmeNm: {
        prtry: "MSISDN",
      },
    },
    forceCret: true,
    usr: "demo UI",
  },
  {
    condTp: "non-overridable block",
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
      id: "77cdd16c42364154a3fd7c974ba64444",
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
    condTp: "non-overridable block",
    condRsn: "Phishing of Account takeover",
    evtTp: ["Pacs.008.001.10", "Pacs.002.001.12"],
    prsptv: "Creditor",
    incptnDtTm: "2025-01-01T12:00:00.000",
    xprtnDtTm: null,
    acct: {
      id: "f75a63bf6400405b809071ef55802253",
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
    condTp: "non-overridable block",
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
]
