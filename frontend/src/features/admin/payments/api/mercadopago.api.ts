import { http } from "../../../../shared/api/http";

interface MercadoPagoOauthStartResponse {
  authorizeUrl: string;
}

export async function startMercadoPagoOauth(): Promise<string> {
  const { data } = await http.post<MercadoPagoOauthStartResponse>(
    "/payments/mercadopago/oauth/start"
  );
  return data.authorizeUrl;
}

export async function disconnectMercadoPagoConnection(): Promise<void> {
  await http.delete("/payments/mercadopago/connection");
}
