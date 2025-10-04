variable "environment" {
  description = "Environment name (lab, prod, etc.)"
  type        = string
}

variable "package_path" {
  description = "Path to the compute package"
  type        = string
}

variable "origins" {
  description = "Map of origins configuration"
  type = map(object({
    name              = string
    host              = string
    override_host     = optional(string, null)
    port              = optional(number, null)
    ssl               = optional(bool, null)
    ssl_check_cert    = optional(bool, null)
    ssl_cert_hostname = optional(string, null)
    ssl_sni_hostname  = optional(string, null)
  }))
  default = {}
}

variable "force_destroy" {
  description = "Allow destruction of resources"
  type        = bool
  default     = false
}
