# ==============================================================================
# MEDICAL SUPPLY PLATFORM - TERRAFORM VARIABLE SETS
# ==============================================================================

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Primary AWS Cloud clinical deployment region"
}

variable "aws_kms_arn" {
  type        = string
  default     = "arn:aws:kms:us-east-1:123456789012:key/clinical-key-uuid"
  description = "AWS KMS key ARN for HIPAA encryption-at-rest"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "PostgreSQL primary database administrator credential"
}

variable "redis_auth_token" {
  type        = string
  sensitive   = true
  description = "Redis TLS authentication token for cluster access"
}

variable "azure_location" {
  type        = string
  default     = "East US"
  description = "Azure Resource Group geographical container location"
}

variable "gcp_project_id" {
  type        = string
  default     = "medical-supply-intelligence"
  description = "Google Cloud Project Identifier"
}

variable "gcp_region" {
  type        = string
  default     = "us-central1"
  description = "Google Cloud primary storage regional block"
}

variable "gcp_kms_key_id" {
  type        = string
  default     = "projects/medical-supply-intelligence/locations/us-central1/keyRings/clinical-ring/cryptoKeys/audit-key"
  description = "GCP KMS key ID for HIPAA compliance bucket encryption"
}
