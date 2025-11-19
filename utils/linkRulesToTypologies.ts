import { Rule, Typology } from "store/processors/processor.interface"

export function linkRulesToTypologies(rules: Rule[], typologies: Typology[]): Rule[] {
    const x = rules.map(rule => ({
    ...rule,
    displayLinkedTypo: typologies
      .filter(typology =>
        typology.linkedRules.some((tRule: any) => tRule.id === rule.id)
      )
      .map(typology => String(typology.id)), // convert id to string
  }));
  return x;
}