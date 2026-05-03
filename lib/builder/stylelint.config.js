/* stylelint.config.js */
module.exports = {
    rules: {
        "custom-property-no-missing-var-function": null,
        "declaration-property-value-no-unknown": null,
        "at-rule-no-unknown": [true, {ignoreAtRules: ["tailwind", "apply", "layer", "config"]}],
    },
};