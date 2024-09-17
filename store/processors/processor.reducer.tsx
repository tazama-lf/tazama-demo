import { ACTIONS } from "./processor.actions"
import { defaultEDLights, defaultTadProcLights } from "./processor.initialState"

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
