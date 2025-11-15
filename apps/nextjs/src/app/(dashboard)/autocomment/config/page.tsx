import { redirect } from "next/navigation";

import { trpcStandalone } from "~/trpc/react";
import {
  AutoCommentConfigurationForm,
  AutoCommentConfigurationFormHeader,
  AutoCommentConfigurationFormProvider,
} from "../_components/autocomment-configuration-form";
import { getFirstAccountId } from "../../layout";

export async function AutoCommentConfigurationPage() {
  const firstAccount = await getFirstAccountId();

  if (firstAccount === undefined) {
    return redirect("/seats");
  }
  const config = await trpcStandalone.autocomment.configuration.load.query({
    linkedInAccountId: firstAccount.id,
  });

  return (
    <div className="px-4">
      <AutoCommentConfigurationFormProvider defaultValues={config ?? undefined}>
        <AutoCommentConfigurationFormHeader />
        {/* <StartAutoCommentModal */}
        {/*   trigger={<Button variant="outline">Start Auto Commenting</Button>} */}
        {/* /> */}
        <AutoCommentConfigurationForm />
      </AutoCommentConfigurationFormProvider>
    </div>
  );
}

export default AutoCommentConfigurationPage;
