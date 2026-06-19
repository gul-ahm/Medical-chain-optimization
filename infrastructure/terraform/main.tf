# ==============================================================================
# MEDICAL SUPPLY PLATFORM - MULTI-CLOUD ENTERPRISE TERRAFORM BLUEPRINTS
# ==============================================================================

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

# Provider Configurations
provider "aws" {
  region = var.aws_region
}

provider "azurerm" {
  features {}
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# ──────────────────────────────────────────────────────────────────────────────
# AWS CLOUD-NATIVE INFRASTRUCTURE (PRIMARY CLINICAL CORE)
# ──────────────────────────────────────────────────────────────────────────────

# 1. Virtual Private Cloud
resource "aws_vpc" "clinical_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name        = "clinical-supply-network-vpc"
    Environment = "production"
    Regulatory  = "HIPAA-FDA"
  }
}

# 2. VPC Subnets for High Availability (Multi-AZ)
resource "aws_subnet" "clinical_private_a" {
  vpc_id            = aws_vpc.clinical_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
}

resource "aws_subnet" "clinical_private_b" {
  vpc_id            = aws_vpc.clinical_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
}

# 3. AWS RDS Managed PostgreSQL (HIPAA Compliant Synchronous Master)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "clinical-rds-subnet-group"
  subnet_ids = [aws_subnet.clinical_private_a.id, aws_subnet.clinical_private_b.id]
}

resource "aws_db_instance" "clinical_postgres" {
  identifier             = "clinical-supply-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.r6g.large"
  allocated_storage      = 200
  max_allocated_storage  = 1000
  db_name                = "medical_supply"
  username               = "clinical_admin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  multi_az               = true # Synchronous replication for 0s RPO
  storage_encrypted      = true # Cryptographical zero-trust audit compliance
  kms_key_id             = var.aws_kms_arn
  skip_final_snapshot    = false
  final_snapshot_identifier = "clinical-supply-postgres-final-snap"
}

# 4. AWS ElastiCache Managed Redis (Encrypted Cache Ring)
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "clinical-redis-subnet-group"
  subnet_ids = [aws_subnet.clinical_private_a.id, aws_subnet.clinical_private_b.id]
}

resource "aws_elasticache_replication_group" "clinical_redis" {
  replication_group_id        = "clinical-redis-ring"
  description                 = "Encrypted clinic memory cluster"
  node_type                   = "cache.m6g.large"
  num_cache_clusters          = 3
  port                        = 6379
  subnet_group_name           = aws_elasticache_subnet_group.redis_subnet_group.name
  transit_encryption_enabled  = true # Zero-trust in-transit
  at_rest_encryption_enabled  = true # Zero-trust at-rest
  kms_key_id                  = var.aws_kms_arn
  auth_token                  = var.redis_auth_token
}

# ──────────────────────────────────────────────────────────────────────────────
# AZURE CLOUD INFRASTRUCTURE (SECONDARY GEO-FAILOVER CORE)
# ──────────────────────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "clinical_rg" {
  name     = "clinical-supply-network-rg"
  location = var.azure_location
}

# Managed Kafka (Azure Event Hubs with Kafka Protocol API)
resource "azurerm_eventhub_namespace" "clinical_kafka" {
  name                = "clinical-supply-events-hub"
  location            = azurerm_resource_group.clinical_rg.location
  resource_group_name = azurerm_resource_group.clinical_rg.name
  sku                 = "Standard"
  capacity            = 5
  auto_inflate_enabled = true
  maximum_throughput_units = 10
}

# ──────────────────────────────────────────────────────────────────────────────
# GCP CLOUD INFRASTRUCTURE (ANALYTICS & LONG-HORIZON MACHINE INFERENCE)
# ──────────────────────────────────────────────────────────────────────────────

# Managed Cloud Storage Bucket (PHI Audit Long-Term Retention)
resource "google_storage_bucket" "clinical_audit_store" {
  name          = "clinical-supply-compliance-audit-ledger-bucket"
  location      = var.gcp_region
  force_destroy = false
  storage_class = "STANDARD"

  encryption {
    default_kms_key_name = var.gcp_kms_key_id
  }

  lifecycle_rule {
    condition {
      age = 2555 # 7 years retention enforcement
    }
    action {
      type = "Delete"
    }
  }
}
