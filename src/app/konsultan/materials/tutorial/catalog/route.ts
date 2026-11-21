import { readTutorialCatalog, tutorialFailure, tutorialPrivateHeaders } from "@/lib/consultant-tutorial-catalog-server";

export async function GET(request: Request) {
  try {
    return Response.json(await readTutorialCatalog(request.headers.get("Authorization")), { headers: tutorialPrivateHeaders });
  } catch (error) { return tutorialFailure(error); }
}
