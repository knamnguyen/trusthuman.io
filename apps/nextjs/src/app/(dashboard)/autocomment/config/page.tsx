import { redirect } from "next/navigation";

import { getQueryClient, HydrateClient, trpc } from "~/trpc/server";
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

  const queryClient = getQueryClient();
  // TODO: use trpcStandalone.query directly instead of using ensureQueryData
  // there is some issue with trpcStandalone tho where nested object access dont work
  const config = await queryClient.ensureQueryData(
    trpc.autocomment.configuration.load.queryOptions({
      linkedInAccountId: firstAccount.id,
    }),
  );

  return (
    <HydrateClient>
      <div className="px-4">
        <AutoCommentConfigurationFormProvider
          defaultValues={config ?? undefined}
        >
          <AutoCommentConfigurationFormHeader />
          {/* <StartAutoCommentModal */}
          {/*   trigger={<Button variant="outline">Start Auto Commenting</Button>} */}
          {/* /> */}
          <AutoCommentConfigurationForm />
        </AutoCommentConfigurationFormProvider>
      </div>
    </HydrateClient>
  );
}

export default AutoCommentConfigurationPage;
