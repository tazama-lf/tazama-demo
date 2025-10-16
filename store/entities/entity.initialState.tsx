import dotenv from "dotenv"
import { PACS002, PACS008, SelectedCreditor, SelectedDebtor, UIConfiguration } from "./entity.interface"

dotenv.config()

const TMS_SERVER_URL = process.env.NEXT_PUBLIC_TMS_SERVER_URL
const TMS_KEY = process.env.NEXT_PUBLIC_TMS_KEY
const CMS_NATS_HOSTING = process.env.NEXT_PUBLIC_CMS_NATS_HOSTING
const NATS_USERNAME = process.env.NEXT_PUBLIC_NATS_USERNAME
const NATS_PASSWORD = process.env.NEXT_PUBLIC_NATS_PASSWORD

// Use NEXT_PUBLIC_ prefixed env variables for UI config
const PG_HOST = process.env.NEXT_PUBLIC_PG_HOST
const PG_PORT = process.env.NEXT_PUBLIC_PG_PORT
const PG_USER = process.env.NEXT_PUBLIC_PG_USER
const PG_PASSWORD = process.env.NEXT_PUBLIC_PG_PASSWORD
const PG_DATABASE = process.env.NEXT_PUBLIC_PG_DATABASE

const WS_URL = process.env.NEXT_PUBLIC_WS_URL
const ADMIN_SERVICE = process.env.NEXT_PUBLIC_ADMIN_SERVICE_HOSTING
const CONDITION_TYPES = process.env.NEXT_PUBLIC_CONDITION_TYPES
const EVENT_TYPES = process.env.NEXT_PUBLIC_EVENT_TYPES
const CONDITION_REASONS = process.env.NEXT_PUBLIC_CONDITION_REASONS

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
              BirthDt: "",
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
              BirthDt: "",
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
              BirthDt: "",
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
          Xprtn: "2021-11-30T10:38:56.000Z",
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
      AccptncDtTm: "",
      InstgAgt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } },
      InstdAgt: { FinInstnId: { ClrSysMmbId: { MmbId: "fsp001" } } },
    },
  },
}

export const uiConfigInitialState: UIConfiguration = {
  tmsServerUrl: TMS_SERVER_URL || "",
  tmsKey: TMS_KEY || "",
  cmsNatsHosting: CMS_NATS_HOSTING || "",
  natsUsername: NATS_USERNAME || "",
  natsPassword: NATS_PASSWORD || "",
  pgHost: PG_HOST || "",
  pgPort: PG_PORT || "",
  pgUser: PG_USER || "",
  pgPassword: PG_PASSWORD || "",
  pgDatabase: PG_DATABASE || "",
  wsIpAddress: WS_URL || "",
  adminServiceUrl: ADMIN_SERVICE || "",
  conditionTypes: CONDITION_TYPES || "",
  eventTypes: EVENT_TYPES || "",
  conditionReasons: CONDITION_REASONS || "",
}

export const rulesLightsInitialState = []
