/**
 * ENOQ Connectors (P6)
 *
 * Ingress/egress bridges to the world.
 * Connectors don't think. They transport.
 */

// Types
export type {
  ConnectorRuntime,
  ConnectorRequest,
  ConnectorResponse,
  Connector,
  EmailIngestPayload,
  EmailEgressPayload,
  WebhookPayload,
  WebhookResponse,
} from './types';

// Email connector
export {
  EmailConnector,
  EmailConnectorConfig,
  createEmailRequest,
  processEmail,
} from './email';

// Webhook connector
export {
  WebhookConnector,
  processWebhook,
  clearIdempotencyCache,
  getIdempotencyCacheSize,
} from './webhook';
