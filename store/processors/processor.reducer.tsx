import { ACTIONS } from "./processor.actions"
import {
  defaultEDLights,
  defaultTadProcLights,
  ruleInitialState,
  typologiesInitialState,
} from "./processor.initialState"

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

    case ACTIONS.GET_CONDITIONS_LOADING:
      return {
        ...state,
        conditionsList: [],
        conditionsLoading: true,
        conditionsError: "",
      }
    case ACTIONS.GET_CONDITIONS_SUCCESS:
      return {
        ...state,
        conditionsList: action.payload,
        conditionsLoading: false,
        conditionsError: "",
      }
    case ACTIONS.GET_CONDITIONS_FAIL:
      return {
        ...state,
        conditionsList: [],
        conditionsLoading: false,
        conditionsError: action.payload,
      }

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
      }
    case ACTIONS.CREATE_CONDITIONS_FAIL:
      return {
        ...state,
        createConLoading: false,
        createConError: action.payload,
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
        typology: action.payload,
      }
    case ACTIONS.UPDATE_TYPO_FAIL:
      return {
        ...state,
        typologyLoading: false,
        typology: [],
      }

    case ACTIONS.UPDATE_TADPROC_LOADING:
      return {
        ...state,
        tadprocLoading: true,
        tadpLights: defaultTadProcLights,
      }
    case ACTIONS.UPDATE_TADPROC_SUCCESS:
      return {
        ...state,
        tadprocLoading: false,
        tadpLights: action.payload,
      }
    case ACTIONS.UPDATE_TADPROC_FAIL:
      return {
        ...state,
        tadprocLoading: false,
        tadpLights: defaultTadProcLights,
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

    case ACTIONS.RESET_TADPROC_RESULTS:
      return {
        ...state,
        // tadProcResults: defaultTadProcLights,
      }
    case ACTIONS.CLEAR_RESULTS:
      return {
        ...state,
        tadProcResults: defaultTadProcLights,
      }
    case ACTIONS.SET_TADPROC_RESULTS:
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
        tadpLights: defaultTadProcLights,
        rules: state.rules.map((rule: any) => ({ ...rule, color: "n" })),
        typologies: state.typologies.map((typo: any) => ({ ...typo, color: "n" })),
        edLights: defaultEDLights,
        tadProcResults: defaultTadProcLights,
      }
  }
}

export default ProcessorReducer
