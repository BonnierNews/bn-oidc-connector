locals {
  origins = {
    "oidc-connector-test" = {
      name              = "oidc-connector-test.pt.bn.nr"
      host              = "echo.pt.bn.nr"
      override_host     = "echo.pt.bn.nr"
      port              = 443
      ssl               = true
      ssl_check_cert    = true
      ssl_cert_hostname = "echo.pt.bn.nr"
      ssl_sni_hostname  = "echo.pt.bn.nr"
    }
  }
}
