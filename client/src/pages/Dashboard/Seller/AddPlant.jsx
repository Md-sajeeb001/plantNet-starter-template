import { Helmet } from "react-helmet-async";
import AddPlantForm from "../../../components/Form/AddPlantForm";
import { imageUpload } from "../../../api/utils";
import useAuth from "../../../hooks/useAuth";
import { useState } from "react";
import toast from "react-hot-toast";

import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const AddPlant = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadImage, setuploadImage] = useState({
    image: { name: "Upload Image" },
  });

  const handelSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const category = form.category.value;
    const description = form.description.value;
    const price = parseFloat(form.price.value);
    const quantity = parseInt(form.quantity.value);
    const image = form.image.files[0];
    const imageUrl = await imageUpload(image);
    setLoading(true);

    // seller info
    const seller = {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    };

    const plants = {
      name,
      category,
      description,
      price,
      quantity,
      image: imageUrl,
      seller,
    };

    // save the plant Info in db
    try {
      await axiosSecure.post(`/plants`, plants);
      toast.success("plant added successfully!");
      navigate("/dashboard/my-inventory");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm
        handelSubmit={handelSubmit}
        uploadImage={uploadImage}
        setuploadImage={setuploadImage}
        loading={loading}
      />
    </div>
  );
};

export default AddPlant;
