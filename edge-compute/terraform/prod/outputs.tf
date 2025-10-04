output "config_store_id" {
  description = "ID of the Fastly config store"
  value       = module.onelogin_compute.config_store_id
}

output "secret_store_id" {
  description = "ID of the Fastly secret store"
  value       = module.onelogin_compute.secret_store_id
}

output "compute_service_id" {
  description = "ID of the Fastly compute service"
  value       = module.onelogin_compute.compute_service_id
}

output "dns_challenge_records" {
  description = "DNS challenge records for ACME validation"
  value       = module.onelogin_compute.dns_challenge_records
}
