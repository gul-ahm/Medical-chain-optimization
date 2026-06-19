# ==============================================================================
# MEDICAL SUPPLY PLATFORM - TERRAFORM EXPORTED ENDPOINTS
# ==============================================================================

output "aws_postgres_endpoint" {
  value       = aws_db_instance.clinical_postgres.endpoint
  description = "PostgreSQL cluster active entry connection string"
}

output "aws_redis_primary_endpoint" {
  value       = aws_elasticache_replication_group.clinical_redis.configuration_endpoint_address
  description = "Redis cluster encrypted primary address"
}

output "azure_kafka_endpoint" {
  value       = azurerm_eventhub_namespace.clinical_kafka.default_primary_connection_string
  sensitive   = true
  description = "Azure EventHubs-Kafka endpoint connection string"
}

output "gcp_audit_bucket_uri" {
  value       = google_storage_bucket.clinical_audit_store.url
  description = "GCP bucket clinical audit immutable vault URI"
}
