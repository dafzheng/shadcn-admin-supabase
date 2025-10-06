import { EmailForm, emailListSchema } from "../data/schema";
import { authedAxios } from "@/lib/authed-axios";

export async function upsertEmail(id: string, email: EmailForm): Promise<any> {

  if (email.type === 'email') {

    const resp = await authedAxios({
      url: "/api/emails",
      method: "POST",
      data: {
        id,
        type: email.type,
        email_name: email.emailName,
        content: email.content,
        subject: email.subject,
        mjml_string: email.mjml,
        ai_config: null,
        description: email.description
      }
    });

    return resp.data;

  } else if (email.type === 'newsletter') {

    const resp = await authedAxios({
      url: "/api/emails",
      method: "POST",
      data: {
        id,
        type: email.type,
        email_name: email.emailName,
        content: email.content,
        subject: email.subject,
        mjml_string: email.mjml,
        description: email.description,
        ai_config: {
          topic: email.newsletterTopic,
          type: email.newsletterType,
          tone: email.newsletterTone,
          targetAudience: email.newsletterTargetAudience,
          numberOfTopics: email.newsletterNumberOfTopics,
          addAmernetService: email.newsletterAddAmernetService,
          avatar: email.newsletterAvatar,
        }
      }
    });

    return resp.data;
  } else {
    // do nothing
  }



}


export async function deleteEmails(ids: string[]): Promise<void> {

  const resp = await authedAxios({
    url: "/api/emails",
    method: "DELETE",
    data: { ids }
  });
  return resp.data;
}


export async function getEmail(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/emails",
    method: "GET",
  });

  const parsed = emailListSchema.parse(resp.data); // 根據你的 API 回傳格式
  return parsed;
}

