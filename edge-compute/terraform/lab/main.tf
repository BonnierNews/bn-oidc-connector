terraform {
  backend "gcs" {
    bucket = "plattform-terraform-states"
    prefix = "bn-oidc-connector-lab"
  }
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

provider "fastly" {}

locals {
  environment = "lab"
  package     = "${path.module}/../../compute/pkg/Auth-at-edge-with-OAuth-2-0.tar.gz"
}

module "onelogin_compute" {
  source = "../modules/onelogin-compute"

  environment   = local.environment
  package_path  = local.package
  origins       = local.origins
  force_destroy = true
}
