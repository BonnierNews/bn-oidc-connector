# fastly-onelogin-compute terraform module

terraform {
  required_providers {
    fastly = {
      source  = "fastly/fastly"
      version = ">= 8.0.0"
    }
    google = {
      source  = "hashicorp/google"
      version = ">= 7.2.0"
    }
  }
}

resource "fastly_configstore" "config_store" {
  name = "bn_oidc_config_${var.environment}"
  lifecycle {
    prevent_destroy = true
  }
}

resource "fastly_configstore_entries" "config_store_entries" {
  store_id = fastly_configstore.config_store.id
  entries = {
    callback_path           = "/id/login/callback"
    scope                   = "openid"
    code_challenge_method   = "S256"
    introspect_access_token = "false"
    jwt_access_token        = "true"
  }
}

resource "fastly_secretstore" "secret_store" {
  name = "bn_oidc_secrets_${var.environment}"
  lifecycle {
    prevent_destroy = true
  }
}

resource "fastly_service_compute" "compute" {
  name = "bn-oidc-connector-compute-${var.environment}"

  dynamic "domain" {
    for_each = var.origins
    content {
      name = domain.value.name
    }
  }

  package {
    filename = var.package_path
  }

  resource_link {
    name        = "oauth_config"
    resource_id = fastly_configstore.config_store.id
  }

  resource_link {
    name        = "oauth_secrets"
    resource_id = fastly_secretstore.secret_store.id
  }

  backend {
    name              = "idp"
    address           = "bn-login-id-service-di-lab.bnu.bn.nr"
    override_host     = "bn-login-id-service-di-lab.bnu.bn.nr"
    port              = 443
    use_ssl           = true
    ssl_check_cert    = true
    ssl_cert_hostname = "bn-login-id-service-di-lab.bnu.bn.nr"
    ssl_sni_hostname  = "bn-login-id-service-di-lab.bnu.bn.nr"
  }

  dynamic "backend" {
    for_each = var.origins
    content {
      name              = "origin"
      address           = backend.value.host
      override_host     = lookup(backend.value, "override_host", backend.value.host)
      port              = lookup(backend.value, "port", 443)
      use_ssl           = lookup(backend.value, "ssl", true)
      ssl_check_cert    = lookup(backend.value, "ssl_check_cert", true)
      ssl_cert_hostname = lookup(backend.value, "ssl_cert_hostname", backend.value.host)
      ssl_sni_hostname  = lookup(backend.value, "ssl_sni_hostname", backend.value.host)
    }
  }

  lifecycle {
    ignore_changes = [package]
  }

  force_destroy = var.force_destroy
}

resource "fastly_tls_subscription" "subscriptions" {
  for_each = { for origin in var.origins : origin.name => origin }

  domains               = [each.key]
  certificate_authority = "lets-encrypt"
  force_destroy         = var.force_destroy
  force_update          = true
}
