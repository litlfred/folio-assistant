Feature: precisionScalar — the schema and type guard for a decimal string with a precision

  @test:schemas/precision-scalar.test.ts::precisionScalar_schema_and_type_guard::acceptsDecimalsAndScientific
  Scenario: accepts signed decimals and scientific notation with positive dps
    Given the values "1.10997859555418057528", "-42", "1.23e10", "1.23e+10", "1.23E-10" and "0.0005E+3", each with dps 50
    Then the schema accepts each one
    And isPrecisionScalar is true for each one

  @test:schemas/precision-scalar.test.ts::precisionScalar_schema_and_type_guard::rejectsMalformedAndNonPositiveDps
  Scenario: rejects malformed decimal strings and non-positive dps
    Then the schema rejects the values "abc" and "1.2.3" with dps 50
    And it rejects the value "1.5" with dps 0, -10 or 12.5

  @test:schemas/precision-scalar.test.ts::precisionScalar_schema_and_type_guard::orNumberAcceptsNumbersAndEnvelopes
  Scenario: precisionScalarOrNumber accepts both legacy f64 numbers and envelopes
    Then precisionScalarOrNumber accepts the number 3.14159
    And it accepts the envelope with value "3.14159265358979323846" and dps 20
    And isPrecisionScalar is false for the number 3.14159 and for null
