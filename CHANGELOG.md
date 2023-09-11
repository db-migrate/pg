## [1.5.1](https://github.com/db-migrate/pg/compare/v1.5.0...v1.5.1) (2023-09-11)


### Bug Fixes

* **createMigrationsTable:** Fix bug where already-quoted search path components could get double-quoted when creating the mirations table. ([79436f3](https://github.com/db-migrate/pg/commit/79436f3d261206c5b26c2fa56a69305d8eabbe12))
* **searchPath:** escaping of search ([13e956b](https://github.com/db-migrate/pg/commit/13e956bf619b1ec283aa26e32377d2d48c96e074)), closes [#46](https://github.com/db-migrate/pg/issues/46)


### Features

* support ifNotExists when creating a postgres db ([b554d2b](https://github.com/db-migrate/pg/commit/b554d2bb6718fdde29c7a7bd7a642a98251e6d77))



# [1.5.0](https://github.com/db-migrate/pg/compare/v1.4.2...v1.5.0) (2023-09-10)


### Bug Fixes

* Add check for rules object ([54ed736](https://github.com/db-migrate/pg/commit/54ed736bbcdfe11c4211c86c47d7d4c4597976a6))
* **deps:** upgrade semver because of vulnerability ([de3c2ce](https://github.com/db-migrate/pg/commit/de3c2ceb9de1806fb8efe84aae4b24184ad13f7a))


### Features

* **bigserial:** support BIGSERIAL when using autoIncrement with bigint type ([6fcd36d](https://github.com/db-migrate/pg/commit/6fcd36d6dc4ce727f5f4c584f60f82e20e392b06))



## [1.4.2](https://github.com/db-migrate/pg/compare/v1.4.1...v1.4.2) (2023-09-07)



## [1.4.1](https://github.com/db-migrate/pg/compare/v1.4.0...v1.4.1) (2023-09-07)



# [1.4.0](https://github.com/db-migrate/pg/compare/v1.3.2...v1.4.0) (2023-09-07)


### Bug Fixes

* **switchDatabase:** scope configuration not working with schema ([d52cdcf](https://github.com/db-migrate/pg/commit/d52cdcf369e43cd5307a3d36e1bb80d029ee2b4e))



## [1.3.2](https://github.com/db-migrate/pg/compare/v1.3.1...v1.3.2) (2023-09-01)



## [1.3.1](https://github.com/db-migrate/pg/compare/v1.3.0...v1.3.1) (2023-09-01)



# [1.3.0](https://github.com/db-migrate/pg/compare/v1.2.4...v1.3.0) (2023-05-04)


### Reverts

* Revert "Revert "ssl handling on normal pg edition"" ([308bbf8](https://github.com/db-migrate/pg/commit/308bbf867c6901cfac99884deace3181c603102a))



## [1.2.4](https://github.com/db-migrate/pg/compare/v1.2.3...v1.2.4) (2023-05-04)


### Reverts

* Revert "ssl handling on normal pg edition" ([b7dc579](https://github.com/db-migrate/pg/commit/b7dc57927338de8fad8d21f84ef0dd710c76888a))



## [1.2.3](https://github.com/db-migrate/pg/compare/v1.2.2...v1.2.3) (2023-05-03)



## [1.2.2](https://github.com/db-migrate/pg/compare/v1.2.1...v1.2.2) (2020-05-13)


### Bug Fixes

* **travis:** add postgresql service ([1268ecc](https://github.com/db-migrate/pg/commit/1268ecc2c59665a8738ed09122519e719d1b616c))
* upgrade pg to 8.0.3 to support node 14 ([7a69a30](https://github.com/db-migrate/pg/commit/7a69a301f8615fba4bf690604e0ddb4d95a510bc))



## [1.2.1](https://github.com/db-migrate/pg/compare/v1.2.0...v1.2.1) (2020-04-15)



# [1.2.0](https://github.com/db-migrate/pg/compare/v1.1.0...v1.2.0) (2020-04-15)


### Bug Fixes

* **changeColumn:** chain, not callbacks for passthrough ([ebe88a0](https://github.com/db-migrate/pg/commit/ebe88a0d33a84018a453754fffe216ef295b7418))



# [1.1.0](https://github.com/db-migrate/pg/compare/v1.0.0...v1.1.0) (2020-04-14)


### Features

* **v2:** add support for options handler and columnStrategies ([4207b65](https://github.com/db-migrate/pg/commit/4207b65a064ed8b389c0b1ccc65cc324623b2e5b))



# [1.0.0](https://github.com/db-migrate/pg/compare/v0.5.1...v1.0.0) (2019-06-08)


### Features

* **methods:** overwrite necessary functions for new migrator functions ([46fa3a3](https://github.com/db-migrate/pg/commit/46fa3a3abbf0ddaa236dad63454e9074e31edd67))



## [0.5.1](https://github.com/db-migrate/pg/compare/v0.5.0...v0.5.1) (2019-05-13)


### Bug Fixes

* **addForeignKey:** pass joined strings to `util.format` ([21cbfe5](https://github.com/db-migrate/pg/commit/21cbfe5095db96a3328905d3ed02dac02c367a57))



# [0.5.0](https://github.com/db-migrate/pg/compare/v0.4.0...v0.5.0) (2019-02-11)


### Features

* **defaultValue:** add advanced handling for defaultValues ([a13c0e0](https://github.com/db-migrate/pg/commit/a13c0e0edf39798427cab2c2994a32fb51a7e62b))
* **defaultValue:** add support for timestamps and add internal handling ([46f01a2](https://github.com/db-migrate/pg/commit/46f01a223c417ba5dd3d49d4727b22ce84b8be65))



# [0.4.0](https://github.com/db-migrate/pg/compare/v0.3.1...v0.4.0) (2018-04-02)


### Bug Fixes

* **version:** fallback to string based check ([8b6b958](https://github.com/db-migrate/pg/commit/8b6b9587ffd36aa81b76b1517d2ba7ed60c829f4)), closes [#32](https://github.com/db-migrate/pg/issues/32)
* **version:** use server_version_num instead of server_version ([ba07af7](https://github.com/db-migrate/pg/commit/ba07af7f36896e122426cb50a3c7138328d220ef))



## [0.3.1](https://github.com/db-migrate/pg/compare/v0.3.0...v0.3.1) (2018-02-11)


### Bug Fixes

* **timezone:** with timezone being emitted to late ([2d3f10d](https://github.com/db-migrate/pg/commit/2d3f10db7ae53ab42871ef055c238dca17fd7638))
* **vuln:** update vulnerable dependency ([c409048](https://github.com/db-migrate/pg/commit/c40904806561f69b38c60f3feceb9eaedd36b39d))



# [0.3.0](https://github.com/db-migrate/pg/compare/v0.2.5...v0.3.0) (2018-01-27)


### Bug Fixes

* 10.1 version ([c4a8de4](https://github.com/db-migrate/pg/commit/c4a8de40e59d055d7280559a5f5fbe58d71eda61))
* unhandled error event on connection ([c19d201](https://github.com/db-migrate/pg/commit/c19d201e59d8dc07c3b5aa0d268d906fd0c5dece))


### Features

* Connect to postgres db on empty database configuration ([e98f32e](https://github.com/db-migrate/pg/commit/e98f32eaac245333780a545a7bbf8668585622b1))



## [0.2.5](https://github.com/db-migrate/pg/compare/v0.2.4...v0.2.5) (2017-08-14)



## [0.2.4](https://github.com/db-migrate/pg/compare/v0.2.3...v0.2.4) (2017-06-25)



## [0.2.3](https://github.com/db-migrate/pg/compare/v0.2.2...v0.2.3) (2017-06-25)



## [0.2.2](https://github.com/db-migrate/pg/compare/v0.2.1...v0.2.2) (2017-06-25)



## [0.2.1](https://github.com/db-migrate/pg/compare/v0.2.0...v0.2.1) (2017-06-25)



# [0.2.0](https://github.com/db-migrate/pg/compare/v0.1.15...v0.2.0) (2017-06-25)



## [0.1.15](https://github.com/db-migrate/pg/compare/v0.1.14...v0.1.15) (2017-06-25)



## [0.1.14](https://github.com/db-migrate/pg/compare/v0.1.13...v0.1.14) (2017-06-25)



## [0.1.13](https://github.com/db-migrate/pg/compare/v0.1.12...v0.1.13) (2017-06-25)



## [0.1.12](https://github.com/db-migrate/pg/compare/v0.1.11...v0.1.12) (2017-06-25)


### Bug Fixes

* **docs:** added example npm install to readme ([336d468](https://github.com/db-migrate/pg/commit/336d46815e05a117eb02f2d9699359be369f1b0b))



## [0.1.11](https://github.com/db-migrate/pg/compare/v0.1.10...v0.1.11) (2016-10-19)


### Bug Fixes

* **spec:** defaultValue should be checked for undefined only ([37a471c](https://github.com/db-migrate/pg/commit/37a471c993a575f263fabfac3db458f722496e87))


### Features

* **tests:** move tests into the repo of the driver ([61dc9e1](https://github.com/db-migrate/pg/commit/61dc9e177c4f87bed95391ab7636f809faad3414))



## [0.1.10](https://github.com/db-migrate/pg/compare/v0.1.9...v0.1.10) (2016-05-12)


### Bug Fixes

* **upstream:** update postgres dependency ([d9212b8](https://github.com/db-migrate/pg/commit/d9212b89fbf1aebda7feade7fcbd8aca75a6b55e)), closes [#9](https://github.com/db-migrate/pg/issues/9)



## [0.1.9](https://github.com/db-migrate/pg/compare/v0.1.8...v0.1.9) (2016-02-03)


### Bug Fixes

* **upstream:** bump upstream package to fix dropTable bug ([e935679](https://github.com/db-migrate/pg/commit/e93567939817cb265c07c21bce6afb43bc8f7529))



## [0.1.8](https://github.com/db-migrate/pg/compare/v0.1.7...v0.1.8) (2016-01-27)


### Bug Fixes

* **api:** drop table overwrite options on promises ([886b8f5](https://github.com/db-migrate/pg/commit/886b8f5374e11ba002e0566ccd5abdef63aca882))



## [0.1.7](https://github.com/db-migrate/pg/compare/v0.1.6...v0.1.7) (2016-01-04)



## [0.1.6](https://github.com/db-migrate/pg/compare/v0.1.5...v0.1.6) (2015-11-04)



## [0.1.5](https://github.com/db-migrate/pg/compare/v0.1.4...v0.1.5) (2015-10-20)



## [0.1.4](https://github.com/db-migrate/pg/compare/v0.1.3...v0.1.4) (2015-09-10)



## [0.1.3](https://github.com/db-migrate/pg/compare/v0.1.2...v0.1.3) (2015-09-10)



## [0.1.2](https://github.com/db-migrate/pg/compare/v0.1.1...v0.1.2) (2015-09-10)



## 0.1.1 (2015-09-08)



