import axios from "axios";
import { fetchQuestionTopics } from "./FetchQuestionService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("fetchQuestionTopics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
  });

  it.each(["practice", "test", "prep", "experiment"] as const)(
    "calls the correct endpoint for %s questions",
    async (type) => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      await fetchQuestionTopics(type);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/${type}questions/topics`)
      );
    }
  );

  it("returns the array of id/topics pairs from the response", async () => {
    const data = [
      { id: 1, topics: ["Recursion", "Lists"] },
      { id: 2, topics: null },
    ];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const result = await fetchQuestionTopics("practice");
    expect(result).toEqual(data);
  });

  it("wraps an axios error in a descriptive Error", async () => {
    const axiosError = new Error("Network Error");
    mockedAxios.get.mockRejectedValueOnce(axiosError);
    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    (axiosError as any).message = "Network Error";

    await expect(fetchQuestionTopics("test")).rejects.toThrow(
      "Failed to fetch question topics: Network Error"
    );
  });

  it("re-throws non-axios errors unchanged", async () => {
    const err = new TypeError("unexpected");
    mockedAxios.get.mockRejectedValueOnce(err);
    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

    await expect(fetchQuestionTopics("prep")).rejects.toBe(err);
  });
});
