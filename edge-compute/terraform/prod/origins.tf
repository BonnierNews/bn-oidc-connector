locals {
  origins = {
    "site-di-lab" = {
      name              = "site.lab.di.se"
      host              = "flamingo-lab.di.se"
      override_host     = "flamingo-lab.di.se"
      port              = 443
      ssl               = true
      ssl_check_cert    = true
      ssl_cert_hostname = "flamingo-lab.di.se"
      ssl_sni_hostname  = "flamingo-lab.di.se"
    },
    "site-di-latest" = {
      name              = "site.latest.di.se"
      host              = "flamingo-latest.di.se"
      override_host     = "flamingo-latest.di.se"
      port              = 443
      ssl               = true
      ssl_check_cert    = true
      ssl_cert_hostname = "flamingo-latest.di.se"
      ssl_sni_hostname  = "flamingo-latest.di.se"
    }
  }
}
