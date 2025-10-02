output "config_store_id" {
  description = "ID of the Fastly config store"
  value       = fastly_configstore.config_store.id
}

output "secret_store_id" {
  description = "ID of the Fastly secret store"
  value       = fastly_secretstore.secret_store.id
}

output "compute_service_id" {
  description = "ID of the Fastly compute service"
  value       = fastly_service_compute.compute.id
}

output "tls_subscription_ids" {
  description = "Map of TLS subscription IDs"
  value       = { for k, v in fastly_tls_subscription.subscriptions : k => v.id }
}

output "dns_challenge_records" {
  description = "DNS challenge records for ACME validation"
  value = {
    for domain, subscription in fastly_tls_subscription.subscriptions : domain => {
      for challenge in subscription.managed_dns_challenges : challenge.record_name => {
        name  = challenge.record_name
        type  = challenge.record_type
        value = challenge.record_value
      }
    }
  }
}

