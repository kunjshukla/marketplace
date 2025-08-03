declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    export class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    export class PayPalHttpClient {
      constructor(environment: SandboxEnvironment | LiveEnvironment);
      execute(request: any): Promise<any>;
    }
  }
  
  export namespace orders {
    export class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: any): void;
    }
    export class OrdersCaptureRequest {
      constructor(orderId: string);
    }
  }
}
