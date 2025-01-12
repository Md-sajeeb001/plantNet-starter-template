import Card from "./Card";
import Container from "../Shared/Container";
import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../../hooks/useAxiosPublic";
import LoadingSpinner from "../Shared/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const Plants = () => {
  const axiosPublic = useAxiosPublic();
  const navigate = useNavigate();

  const { data: plants = [], isLoading } = useQuery({
    queryKey: ["plants"],
    queryFn: async () => {
      const { data } = await axiosPublic.get("/plants");
      return data;
    },
  });
  if (isLoading) {
    return <LoadingSpinner></LoadingSpinner>;
  }

  return (
    <Container>
      {plants && plants.length > 0 ? (
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
          {plants.map((plant) => (
            <Card key={plant._id} plant={plant} />
          ))}
        </div>
      ) : (
        <div className="text-4xl font-bold max-w-4xl mx-auto text-black">
          <h3>No Plants Avilable</h3>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-1/2 px-5 py-1 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 sm:w-auto   hover:bg-gray-100 "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 rtl:rotate-180 text-lime-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
              />
            </svg>

            <span>Go back</span>
          </button>{" "}
        </div>
      )}
    </Container>
  );
};

export default Plants;
