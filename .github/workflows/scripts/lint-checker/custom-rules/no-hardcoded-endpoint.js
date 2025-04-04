const url = require('url');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Disallow string literals with has hostnames matching the provided list of hosts",
    },
    messages: {
      avoidHardcoding:`Do not hardcode the DevRev API endpoint. Use the host provided in the event object (event.execution_metadata.devrev_endpoint) or refer documentation for best practices.`
    },
  },
  create(context) {
    // Get the list of hosts not allowed to be hardcoded from the rule options
    const notAllowedHosts = context.options[0] || ["api.devrev.ai"];

    return {
      Literal(node) {
          try {
            if (typeof node.value !== 'string') {
              return;
            }
            const parsedUrl = new url.URL(node.value);
            const hostname = parsedUrl.hostname;

            if (notAllowedHosts.includes(hostname.toLowerCase())) {
              context.report({
                node,
                messageId: "avoidHardcoding",
              });
            }
          } catch (error) {
            // If parsing the URL fails, ignore it
          }
      },
    };
  },
};