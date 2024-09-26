export interface DebtorEntity {
  Dbtr: {
    Nm: string
    Id: {
      PrvtId: {
        DtAndPlcOfBirth: {
          BirthDt: string
          CityOfBirth: string
          CtryOfBirth: string
        }
        Othr: [
          {
            Id: string
            SchmeNm: {
              Prtry: string
            }
          },
        ]
      }
    }
    CtctDtls: { MobNb: string }
  }
}

export interface DebtorAccount {
  DbtrAcct: {
    Id: {
      Othr: [
        {
          Id: string
          SchmeNm: {
            Prtry: string
          }
        },
      ]
    }
    Nm: string
  }
}

export interface CreditorAccount {
  CdtrAcct: {
    Id: {
      Othr: [
        {
          Id: string
          SchmeNm: {
            Prtry: string
          }
        },
      ]
    }
    Nm: string
  }
}

export interface Entity {
  Entity: DebtorEntity
  Accounts: Array<DebtorAccount>
}

export interface CdtrEntity {
  CreditorEntity: CreditorEntity
  CreditorAccounts: Array<CreditorAccount>
}

export interface CreditorEntity {
  Cdtr: {
    Nm: string
    Id: {
      PrvtId: {
        DtAndPlcOfBirth: {
          BirthDt: string
          CityOfBirth: string
          CtryOfBirth: string
        }
        Othr: [
          {
            Id: string
            SchmeNm: {
              Prtry: string
            }
          },
        ]
      }
    }
    CtctDtls: { MobNb: string }
  }
}

export interface Country {
  name: string
  dial_code: string
  emoji: string
  code: string
}

export interface PACS008 {
  TxTp: string
  FIToFICstmrCdtTrf: {
    GrpHdr: {
      MsgId: string
      CreDtTm: string
      NbOfTxs: number
      SttlmInf: {
        SttlmMtd: string
      }
    }
    CdtTrfTxInf: {
      PmtId: {
        InstrId: string
        EndToEndId: string
      }
      IntrBkSttlmAmt: {
        Amt: {
          Amt: number
          Ccy: string
        }
      }
      InstdAmt: {
        Amt: {
          Amt: number
          Ccy: string
        }
      }
      ChrgBr: string
      ChrgsInf: {
        Amt: {
          Amt: number
          Ccy: string
        }
        Agt: {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: string
            }
          }
        }
      }
      InitgPty: {
        Nm: string
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: string
              CityOfBirth: string
              CtryOfBirth: string
            }
            Othr: [
              {
                Id: string
                SchmeNm: {
                  Prtry: string
                }
              },
            ]
          }
        }
        CtctDtls: {
          MobNb: string
        }
      }
      Dbtr: {
        Nm: string
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: string
              CityOfBirth: string
              CtryOfBirth: string
            }
            Othr: [
              {
                Id: string
                SchmeNm: {
                  Prtry: string
                }
              },
            ]
          }
        }
        CtctDtls: {
          MobNb: string
        }
      }
      DbtrAcct: {
        Id: {
          Othr: [
            {
              Id: string
              SchmeNm: {
                Prtry: string
              }
            },
          ]
        }
        Nm: string
      }
      DbtrAgt: {
        FinInstnId: {
          ClrSysMmbId: {
            MmbId: string
          }
        }
      }
      CdtrAgt: {
        FinInstnId: {
          ClrSysMmbId: {
            MmbId: string
          }
        }
      }
      Cdtr: {
        Nm: string
        Id: {
          PrvtId: {
            DtAndPlcOfBirth: {
              BirthDt: string
              CityOfBirth: string
              CtryOfBirth: string
            }
            Othr: [
              {
                Id: string
                SchmeNm: {
                  Prtry: string
                }
              },
            ]
          }
        }
        CtctDtls: {
          MobNb: string
        }
      }
      CdtrAcct: {
        Id: {
          Othr: [
            {
              Id: string
              SchmeNm: {
                Prtry: string
              }
            },
          ]
        }
        Nm: string
      }
      Purp: {
        Cd: string
      }
    }
    RgltryRptg: {
      Dtls: {
        Tp: string
        Cd: string
      }
    }
    RmtInf: {
      Ustrd: string
    }
    SplmtryData: {
      Envlp: {
        Doc: {
          Xprtn: string
          InitgPty: {
            Glctn: {
              Lat: string
              Long: string
            }
          }
        }
      }
    }
  }
}

export interface PACS002 {
  FIToFIPmtSts: {
    GrpHdr: {
      MsgId: string
      CreDtTm: string
    }
    TxInfAndSts: {
      OrgnlInstrId: string
      OrgnlEndToEndId: string
      TxSts: string
      ChrgsInf: [
        {
          Amt: {
            Amt: number
            Ccy: string
          }
          Agt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: string
              }
            }
          }
        },
        {
          Amt: {
            Amt: number
            Ccy: string
          }
          Agt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: string
              }
            }
          }
        },
        {
          Amt: {
            Amt: number
            Ccy: string
          }
          Agt: {
            FinInstnId: {
              ClrSysMmbId: {
                MmbId: string
              }
            }
          }
        },
      ]
      AccptncDtTm: string
      InstgAgt: {
        FinInstnId: {
          ClrSysMmbId: {
            MmbId: string
          }
        }
      }
      InstdAgt: {
        FinInstnId: {
          ClrSysMmbId: {
            MmbId: string
          }
        }
      }
    }
  }
}

export interface SelectedDebtor {
  debtorSelectedIndex: number | undefined
  debtorAccountsLength: number | undefined
  debtorAccountSelectedIndex: number | undefined
}

export interface SelectedCreditor {
  creditorSelectedIndex: number | undefined
  creditorAccountsLength: number | undefined
  creditorAccountSelectedIndex: number | undefined
}

export interface UIConfiguration {
  tmsServerUrl: string
  tmsKey: string
  cmsNatsHosting: string
  natsUsername: string
  natsPassword: string
  arangoDBHosting: string
  dbUser: string
  dbPassword: string
  wsIpAddress: string
}

export interface UIConfigs {
  config: Array<UIConfiguration>
}
