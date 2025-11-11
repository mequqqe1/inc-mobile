import * as SignalR from "@microsoft/signalr";
import { storage } from "../utils/storage";

export function buildZeynHub(baseUrl: string) {
  const hubUrl = `${baseUrl.replace(/\/$/, "")}/hubs/zeynai`;
  const connection = new SignalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: async () => (await storage.getItem("accessToken")) || "",
    })
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: () => 1500 })
    .configureLogging(SignalR.LogLevel.Information)
    .build();
  return connection;
}
