export type QuantumStatus = 'pqc' | 'hybrid' | 'classical' | 'pending'
export type RiskLevel = 'low' | 'medium' | 'high' | null

export interface Department {
  dept_id: string
  name: string
  algorithm: string
  usage: string
  quantum_status: QuantumStatus
  quantum_risk: RiskLevel
  sign_count_30d: number
  last_sign_at: string | null
}

export interface CbomEntry {
  id: string
  dept_id: string
  dept_name: string
  algorithm: string
  doc_type: string
  operation: 'sign' | 'verify'
  quantum_safe: boolean
  timestamp: string
}

export interface CbomSummary {
  total: number
  pqc: number
  hybrid: number
  classical: number
  pending: number
}

export interface CbomResponse {
  summary: CbomSummary
  departments: Department[]
  recent_entries: CbomEntry[]
}
