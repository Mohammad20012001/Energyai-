import { StringConfigurationClientPage } from "@/components/string-configuration-client-page";

export default function StringConfigurationPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">تهيئة السلاسل بالذكاء الاصطناعي</h1>
        <p className="text-muted-foreground mt-2">
          حدد العدد الأمثل للألواح لكل سلسلة والسلاسل المتوازية لتلبية متطلبات الجهد والتيار لديك.
        </p>
      </div>
      <StringConfigurationClientPage />
    </div>
  );
}
