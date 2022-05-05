<div align="center">
  <img width="200" height="auto" src="logo.svg">
  <br>
  <b>Part of the Sherlock Pattern Initiative</b>
  <br>
  <a>https://github.com/balena-io-playground/sherlock-pattern-initiative</a>
</div>


# Pattern Json to jellyfish updater

Linking diagnostics retrieved patterns to a given support thread 

# Input

All input is expect at `input` folder
Two files are expected: config.json containing a support thread slug / permalink e.g.:
```
{
    "supportThreadPermalink": "https://jel.ly.fish/support-thread-sherlock-test-1-1d18f72",
    "supportThreadSlug": "support-thread-sherlock-test-1-1d18f72"
}
```

As diagnostics file only one `out_diagnostics.json` with a `results` section is expected. This file is generated from `diagnostics-json-to-patterns-json` transformer

## JF Authentication 
It can either be feed a `JF_AUTH_TOKEN` being the bearer token or `JF_USERNAME` and `JF_PASSWORD`.
Right now the selection is hard coded, and defaults to the `JF_AUTH_TOKEN`

# Output
The reflector has no output as it's linking patterns to support threads directly in jellyfisch


