---
"@indxsearch/indx-types": major
---

The rest of the 6.0 server's requests and answers: `InFilterProxy`, `PositionFilterProxy`,
`FilterExpressionProxy` with `FilterExpressionResultProxy` and `FilterExpressionErrorDetail`, the
saved `BoostRule` and `BuryRule` (`RuleCondition`), a dataset's `DatasetQueryParameters` and
`QueryParametersResponse`, and field profiles (`FieldProfile`, `FieldProfileView`,
`FieldProfilesResponse`, `FieldProfilesRequest`). `FieldProxy.typingPrefixFrom` and
`ValueFilterProxy.isCaseSensitive` are added; `SystemStatus` has `indexedTextTruncated`,
`wordTokenSizeCapped` and `fieldK1Ignored`, and loses `tooLongClientText` and
`unknownConfigurationError`, which the server no longer sends. `IndxProblemCode` names every code
the server answers with, `invalidFilterExpression` among them, and `IndxProblem.errors` carries an
expression's errors. `PageFill`, `MatchReport`, `RecordMatch`, `QueryWordMatch` and `WordMatch` are
exported. Every type is checked against the server's OpenAPI document.
