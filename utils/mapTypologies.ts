import { Typology } from "store/processors/processor.interface"

export function mapTypologies(rawTypologies: any[]): Typology[] {
  return rawTypologies.map((typology: any) => ({
    ...typology,
    id: typology.cfg,
    title: typology.cfg ?? typology.desc, // Prefer cfg, fallback to desc
    typoDescription: typology.desc ?? "",
    color: "n",
    workflow: typology.workflow ?? { alertThreshold: null, interdictionThreshold: null, flowProcessor: null },
    result: null,
    linkedRules: typology.rules?.map((r: any) => r.id) ?? [],
    rules: typology.rules ?? [],
    cfg: typology.cfg,
    expression: typology.expression ?? [],
    stop: false,
  }))
}