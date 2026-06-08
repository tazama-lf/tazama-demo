import { ACTIONS } from "./processor.actions"
import { defaultAdjudicatorLights, defaultEDLights } from "./processor.initialState"

const ProcessorReducer = (state: any, action: any) => {
  switch (action.type) {
    case ACTIONS.CREATE_RULES_LOADING:
      return {
        ...state,
        rulesLoading: true,
      }
    case ACTIONS.CREATE_RULES_SUCCESS:
      return {
        ...state,
        rulesLoading: false,
        rules: action.payload,
      }
    case ACTIONS.CREATE_RULES_FAIL:
      return {
        ...state,
        rulesLoading: false,
        rules: [],
      }

    case ACTIONS.CREATE_TYPO_LOADING:
      return {
        ...state,
        typologyLoading: true,
      }
    case ACTIONS.CREATE_TYPO_SUCCESS:
      return {
        ...state,
        typologyLoading: false,
        typologies: action.payload,
      }
    case ACTIONS.CREATE_TYPO_FAIL:
      return {
        ...state,
        typologyLoading: false,
        typologies: [],
      }

    case ACTIONS.GET_DEBTOR_CONDITIONS_LOADING:
      return {
        ...state,
        conditionsList: [],
        conditionsDataDebtor: {
          conditions: [],
          activeConditions: [],
        },
        conditionsLoading: true,
        conditionsError: "",
      }
    case ACTIONS.GET_DEBTOR_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsList: action.payload,
        conditionsDataDebtor: {
          conditions: action.payload,
          activeConditions: [],
        },
        conditionsLoading: false,
        conditionsError: "",
      }
    case ACTIONS.GET_DEBTOR_CONDITIONS_FAIL:
      return {
        ...state,
        conditionsList: [],
        conditionsDataDebtor: {
          conditions: [],
          activeConditions: [],
        },
        conditionsLoading: false,
        conditionsError: action.payload,
      }

    case ACTIONS.GET_CREDITOR_CONDITIONS_LOADING:
      return {
        ...state,
        conditionsList: [],
        conditionsDataCreditor: {
          conditions: [],
          activeConditions: [],
        },
        conditionsLoading: true,
        conditionsError: "",
      }
    case ACTIONS.GET_CREDITOR_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsList: action.payload,
        conditionsDataCreditor: {
          conditions: action.payload,
          activeConditions: [],
        },
        conditionsLoading: false,
        conditionsError: "",
      }
    case ACTIONS.GET_CREDITOR_CONDITIONS_FAIL:
      return {
        ...state,
        conditionsList: [],
        conditionsDataCreditor: {
          conditions: [],
          activeConditions: [],
        },
        conditionsLoading: false,
        conditionsError: action.payload,
      }

    case ACTIONS.CLEAR_CONDITIONS:
      return {
        ...state,
        conditionsList: [],
        conditionsDataDebtor: {
          conditions: [],
          activeConditions: [],
        },
        conditionsDataCreditor: {
          conditions: [...state.conditionsDataCreditor.conditions],
          activeConditions: [...state.conditionsDataCreditor.activeConditions],
        },
        conditionsLoading: false,
        conditionsError: "",
      }

    case ACTIONS.ADD_GET_DEBTOR_CONDITIONS_LOADING:
      return {
        ...state,
        conditionsDataDebtor: {
          conditions: [...state.conditionsDataDebtor.conditions],
          activeConditions: [...state.conditionsDataDebtor.activeConditions],
        },
        conditionsLoading: true,
        conditionsError: "",
      }
    case ACTIONS.ADD_GET_DEBTOR_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsDataDebtor: {
          conditions: [...state.conditionsDataDebtor.conditions],
          activeConditions: [...action.payload],
        },
        conditionsLoading: false,
        conditionsError: "",
      }
    case ACTIONS.ADD_GET_DEBTOR_CONDITIONS_FAIL:
      return {
        ...state,
        conditionsDataDebtor: {
          conditions: [...state.conditionsDataDebtor.conditions],
          activeConditions: [...state.conditionsDataDebtor.activeConditions],
        },
        conditionsLoading: false,
        conditionsError: action.payload,
      }
    // --------------------------------------------------------------------------------
    case ACTIONS.ADD_GET_CREDITOR_CONDITIONS_LOADING:
      return {
        ...state,
        conditionsDataCreditor: {
          conditions: [...state.conditionsDataCreditor.conditions],
          activeConditions: [...state.conditionsDataCreditor.activeConditions],
        },
        conditionsLoading: true,
        conditionsError: "",
      }
    case ACTIONS.ADD_GET_CREDITOR_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsDataCreditor: {
          conditions: [...state.conditionsDataCreditor.conditions],
          activeConditions: [...action.payload],
        },
        conditionsLoading: false,
        conditionsError: "",
      }
    case ACTIONS.ADD_GET_CREDITOR_CONDITIONS_FAIL:
      return {
        ...state,
        conditionsDataCreditor: {
          conditions: [...state.conditionsDataCreditor.conditions],
          activeConditions: [...state.conditionsDataCreditor.activeConditions],
        },
        conditionsLoading: false,
        conditionsError: action.payload,
      }
    // --------------------------------------------------------------------------------
    case ACTIONS.CREATE_CONDITIONS_LOADING:
      return {
        ...state,
        createConLoading: true,
        createConError: null,
      }
    case ACTIONS.CREATE_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsList: action.payload,
        createConLoading: false,
        createConError: null,
        entityEventType: [],
      }
    case ACTIONS.CREATE_CONDITIONS_FAIL:
      return {
        ...state,
        createConLoading: false,
        createConError: action.payload,
        entityEventType: [],
      }

    case ACTIONS.EXPIRE_CONDITIONS_LOADING:
      return {
        ...state,
        expireConError: undefined,
      }
    case ACTIONS.EXPIRE_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsList: action.payload,
        expireConError: undefined,
      }
    case ACTIONS.EXPIRE_CONDITIONS_FAIL:
      return {
        ...state,
        expireConError: action.payload,
      }

    case ACTIONS.UPDATE_RULES_LOADING:
      return {
        ...state,
        rulesLoading: true,
      }
    case ACTIONS.UPDATE_RULES_SUCCESS:
      return {
        ...state,
        rulesLoading: false,
        rules: action.payload,
      }
    case ACTIONS.UPDATE_RULES_FAIL:
      return {
        ...state,
        rulesLoading: false,
        rules: [],
      }

    case ACTIONS.UPDATE_TYPO_LOADING:
      return {
        ...state,
        typologyLoading: true,
      }
    case ACTIONS.UPDATE_TYPO_SUCCESS:
      return {
        ...state,
        typologyLoading: false,
        typologies: action.payload,
      }
    case ACTIONS.UPDATE_TYPO_FAIL:
      return {
        ...state,
        typologyLoading: false,
        typologies: [],
      }

    case ACTIONS.UPDATE_ADJUDICATOR_LOADING:
      return {
        ...state,
        tadprocLoading: true,
        tadpLights: defaultAdjudicatorLights,
      }
    case ACTIONS.UPDATE_ADJUDICATOR_SUCCESS:
      return {
        ...state,
        tadprocLoading: false,
        tadpLights: action.payload,
      }
    case ACTIONS.UPDATE_ADJUDICATOR_FAIL:
      return {
        ...state,
        tadprocLoading: false,
        tadpLights: defaultAdjudicatorLights,
      }

    case ACTIONS.UPDATE_ED_LOADING:
      return {
        ...state,
        edLightsLoading: true,
        edError: "",
      }
    case ACTIONS.UPDATE_ED_SUCCESS:
      return {
        ...state,
        edLightsLoading: false,
        edLights: action.payload,
        edError: "",
      }
    case ACTIONS.UPDATE_ED_FAIL:
      return {
        ...state,
        edLightsLoading: false,
        edLights: defaultEDLights,
        edError: action.payload,
      }

    case ACTIONS.VALIDATE_RESULTS_LOADING:
      return {
        ...state,
      }
    case ACTIONS.VALIDATE_RESULTS_SUCCESS:
      return {
        ...state,
      }
    case ACTIONS.VALIDATE_RESULTS_FAIL:
      return {
        ...state,
      }

    case ACTIONS.RESET_ADJUDICATOR_RESULTS:
      return {
        ...state,
        tadProcResults: defaultAdjudicatorLights,
        typologiesEFRuP: [],
      }
    case ACTIONS.CLEAR_RESULTS:
      return {
        ...state,
        tadProcResults: defaultAdjudicatorLights,
        typologiesEFRuP: [],
      }
    case ACTIONS.SET_ADJUDICATOR_RESULTS:
      return {
        ...state,
        tadProcResults: action.payload,
        // tadpLights: action.payload,
      }

    case ACTIONS.TURN_RULE_LIGHTS_GREEN:
      return {
        ...state,
        rules: state.rules.map((rule: any) => ({ ...rule, color: "g" })),
      }

    case ACTIONS.TURN_RULE_LIGHTS_NEUTRAL:
      return {
        ...state,
        rules: state.rules.map((rule: any) => ({ ...rule, color: "n" })),
      }

    case ACTIONS.UPDATE_ENTITY_EVENT_TYPE:
      return {
        ...state,
        entityEventType: action.payload,
      }

    case ACTIONS.UPDATE_ENTITY_ALL_CHECKED:
      return {
        ...state,
        entityAllChecked: action.payload,
      }

    case ACTIONS.RESET_ALL_LIGHTS:
      return {
        ...state,
        tadpLights: defaultAdjudicatorLights,
        rules: state.rules.map((rule: any) => ({ ...rule, color: "n" })),
        typologies: state.typologies.map((typo: any) => ({ ...typo, color: "n" })),
        edLights: defaultEDLights,
        tadProcResults: defaultAdjudicatorLights,
      }

    case ACTIONS.UPDATE_DEBTOR_ACTIVE_SECTION:
      return {
        ...state,
        debtorActiveSection: action.payload,
      }

    case ACTIONS.UPDATE_CREDITOR_ACTIVE_SECTION:
      return {
        ...state,
        creditorActiveSection: action.payload,
      }

    case ACTIONS.SET_SHOW_DEBTOR_CONDITIONS:
      return {
        ...state,
        showDebtorConditions: action.payload,
      }
    case ACTIONS.SET_SHOW_CREDITOR_CONDITIONS:
      return {
        ...state,
        showCreditorConditions: action.payload,
      }

    case ACTIONS.SET_SHOW_DEBTOR_CONDITIONS_CREATE:
      return {
        ...state,
        showDebtorConditionsCreate: action.payload,
      }
    case ACTIONS.SET_SHOW_CREDITOR_CONDITIONS_CREATE:
      return {
        ...state,
        showCreditorConditionsCreate: action.payload,
      }
    case ACTIONS.SET_APPLICATION_VERSION:
      return {
        ...state,
        app_version: action.payload,
      }

    case ACTIONS.SET_LINKED_TYPOLOGIES:
      return {
        ...state,
        linkedTypologies: action.payload,
      }
    case ACTIONS.CREATE_TYPO_EFRUP_SUCCESS:
      return {
        ...state,
        typologiesEFRuP: action.payload,
      }

    case ACTIONS.SET_TYPO_EFRUP_SUCCESS:
      return {
        ...state,
        typologiesEFRuP: action.payload,
      }

    case ACTIONS.CLEAR_LINKED_TYPOLOGIES:
      return {
        ...state,
        linkedTypologies: [],
      }
    case ACTIONS.SET_CONDITION_TYPES: {
      return {
        ...state,
        conditionTypes: action.payload,
      }
    }
    case ACTIONS.SET_EVENT_TYPES: {
      return {
        ...state,
        eventTypes: action.payload,
      }
    }
    case ACTIONS.SET_CONDITION_REASONS: {
      return {
        ...state,
        conditionReasons: action.payload,
      }
    }
    default:
      return state
  }
}

export default ProcessorReducer
