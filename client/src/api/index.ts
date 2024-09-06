import {GetListResult, ListOptions} from "@/api/apiTypes.ts";
import {EntityRecord} from "@/types/index.ts";
import {notify} from "@/notify/index.ts";

export interface ErrorInfo {
   statusCode: number;
   message: string;
   title?: string;
}

export class EasyApi {
   host: string;
   private notify: (
      info: { message: string; title: string; type: string },
   ) => void = (info) => {
      console.error(info);
   };

   constructor(host?: string) {
      this.host = host || "/api";
   }

   async call<T extends Record<string, any>>(
      group: string,
      action: string,
      data?: Record<string, any>,
   ): Promise<T> {
      const url = `${this.host}?group=${group as string}&action=${action}`;
      const response = await fetch(url, {
         method: "POST",
         // credentials: "include",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(data),
      }).catch((e) => {
         this.notify({
            message: e.message,
            title: "Network Error",
            type: "error",
         });
         return new Response(null, {status: 500});
      });
      if (!response.ok) {
         if (response.status === 302) {
            window.location.href = response.headers.get("Location") || "/";
         }

         const content = await response.text();
         const info = this.parseError(response, content);
         const title = `${info.title || "API Error"} - ${info.statusCode}`;
         if (
            group === "auth" && action === "check" && info.statusCode === 401
         ) {
            return {} as T;
         }
         this.notify({
            message: info.message,
            title: title,
            type: "error",
         });
         return {} as T;
      }
      return await response.json();
   }

   async getList<T extends EntityRecord = EntityRecord>(entity: string, options?: ListOptions): Promise<GetListResult<T>> {
      const fullOptions = {
         ...options,
         entity
      }
      return await this.call<GetListResult<T>>('entity', "getList", fullOptions);
   }

   async createEntity<T extends EntityRecord = EntityRecord>(entity: string, data: Record<string, any>): Promise<T> {
      return await this.call<T>('entity', "createEntity", {entity, data});
   }

   async getEntity<T extends EntityRecord = EntityRecord>(entity: string, id: string): Promise<T> {
      return await this.call<T>('entity', "getEntity", {entity, id});
   }

   async updateEntity<T extends EntityRecord = EntityRecord>(entity: string, id: string, data: Record<string, any>): Promise<T> {
      return await this.call<T>('entity', "updateEntity", {entity, id, data});
   }

   async deleteEntity(entity: string, id: string): Promise<void> {
      await this.call('entity', "deleteEntity", {entity, id});
   }

   async runEntityAction(entity: string, id: string, action: string, data?: Record<string, any>): Promise<any> {

      return await this.call('entity', "runEntityAction", {entity, id, action, data});
   }

   private parseError(response: Response, errorContent: string) {
      const info = {} as ErrorInfo;
      info.statusCode = response.status;
      let content: any;
      try {
         content = JSON.parse(errorContent ?? "");
         if ("error" in content) {
            content = content.error
         }
         info.message = content;
      } catch (_e) {
         content = errorContent;
      }
      info.message = content;
      return info;
   }

   onNotify(
      callback: (info: { message: string; title: string; type: string }) => void,
   ) {
      this.notify = callback;
   }
}


export const easyApi = new EasyApi(import.meta.env.VITE_API);
easyApi.onNotify((info) => {
   notify({
      title: info.title,
      message: info.message,
      type: info.type as "error" | "success" | "warning" | "info",
   });
});
