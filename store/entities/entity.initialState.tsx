import dotenv from "dotenv"
import { PACS002, PACS008, SelectedCreditor, SelectedDebtor, UIConfiguration } from "./entity.interface"

dotenv.config()

const WS_URL = process.env.NEXT_PUBLIC_WS_URL

export const creditorInitialState: SelectedCreditor = {
  creditorSelectedIndex: undefined,
  creditorAccountsLength: undefined,
  creditorAccountSelectedIndex: undefined,
}
export const debtorInitialState: SelectedDebtor = {
  debtorSelectedIndex: undefined,
  debtorAccountsLength: undefined,
  debtorAccountSelectedIndex: undefined,
}

export const pacs008InitialState: PACS008 = {
  TxTp: "pacs.008.001.10",
  FIToFICstmrCdtTrf: {
    GrpHdr: {
      MsgId: "",
      CreDtTm: "",
      NbOfTxs: 1,
      SttlmInf: {
        SttlmMtd: "CLRG",
      },
    },
    CdtTrfTxInf: {
      PmtId: {
        InstrId: "",
        EndToEndId: "",
      },
      IntrBkSttlmAmt: {
        Amt: {
          Amt: 0,
          Ccy: "USD",
        },
      },
      InstdAmt: {
        Amt: {
          Amt: 0,
          Ccy: "USD",
        },
      },
      ChrgBr: "DEBT",
      ChrgsInf: {
        Amt: {
          Amt: 0.0,
          Ccy: "USD",
        },
        Agt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: "fsp001",
            },
          },
        },
      },
      InitgPty: {
        Nm: "",
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: new Date(),
              CityOfBirth: "Unknown",
              CtryOfBirth: "ZZ",
            },
            Othr: [
              {
                Id: "",
                SchmeNm: {
                  Prtry: "MSISDN",
                },
              },
            ],
          },
        },
        CtctDtls: {
          MobNb: "",
        },
      },
      Dbtr: {
        Nm: "",
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: new Date(),
              CityOfBirth: "Unknown",
              CtryOfBirth: "ZZ",
            },
            Othr: [
              {
                Id: "",
                SchmeNm: {
                  Prtry: "TAZAMA_EID",
                },
              },
            ],
          },
        },
        CtctDtls: {
          MobNb: "",
        },
      },
      DbtrAcct: {
        Id: {
          Othr: [
            {
              Id: "",

              SchmeNm: {
                Prtry: "MSISDN",
              },
            },
          ],
        },
        Nm: "",
      },
      DbtrAgt: {
        FinInstnId: {
          ClrSysMmbId: {
            MmbId: "fsp001",
          },
        },
      },
      CdtrAgt: {
        FinInstnId: {
          ClrSysMmbId: {
            MmbId: "fsp001",
          },
        },
      },
      Cdtr: {
        Nm: "",
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: new Date(),
              CityOfBirth: "Unknown",
              CtryOfBirth: "ZZ",
            },
            Othr: [
              {
                Id: "",
                SchmeNm: {
                  Prtry: "TAZAMA_EID",
                },
              },
            ],
          },
        },
        CtctDtls: {
          MobNb: "",
        },
      },
      CdtrAcct: {
        Id: {
          Othr: [
            {
              Id: "",
              SchmeNm: {
                Prtry: "MSISDN",
              },
            },
          ],
        },
        Nm: "",
      },
      Purp: {
        Cd: "",
      },
    },
    RgltryRptg: {
      Dtls: {
        Tp: "BALANCE OF PAYMENTS",
        Cd: "100",
      },
    },
    RmtInf: {
      Ustrd: "",
    },
    SplmtryData: {
      Envlp: {
        Doc: {
          Xprtn: new Date("2021-11-30T10:38:56.000Z"),
          InitgPty: {
            Glctn: {
              Lat: "",
              Long: "",
            },
          },
        },
      },
    },
  },
}

export const pacs002InitialState: PACS002 = {
  TxTp: "pacs.002.001.12",
  FIToFIPmtSts: {
    GrpHdr: { MsgId: "", CreDtTm: "" },
    TxInfAndSts: {
      OrgnlInstrId: "",
      OrgnlEndToEndId: "",
      TxSts: "ACCC",
      ChrgsInf: [
        { Amt: { Amt: 0, Ccy: "USD" }, Agt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } } },
        { Amt: { Amt: 0, Ccy: "USD" }, Agt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } } },
        { Amt: { Amt: 0, Ccy: "USD" }, Agt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } } },
      ],
      AccptncDtTm: new Date(),
      InstgAgt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } },
      InstdAgt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } },
    },
  },
}

export const uiConfigInitialState: UIConfiguration = {
  tmsServerUrl: "",
  tmsKey: "",
  cmsNatsHosting: "",
  natsUsername: "",
  natsPassword: "",
  pgHost: "",
  pgPort: "",
  pgUser: "",
  pgPassword: "",
  pgDatabase: "",
  wsIpAddress: WS_URL || "",
  adminServiceUrl: "",
  conditionTypes: "",
  eventTypes: "",
  conditionReasons: "",
}

export const rulesLightsInitialState = []
