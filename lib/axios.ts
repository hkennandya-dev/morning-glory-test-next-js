import axios from "axios";

export const fetch = () => {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API || "/",
  });
};