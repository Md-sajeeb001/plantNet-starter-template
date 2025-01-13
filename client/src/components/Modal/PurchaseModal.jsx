/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import Button from "../Shared/Button/Button";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import LoadingSpinner from "../Shared/LoadingSpinner";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const PurchaseModal = ({ closeModal, isOpen, plant, isLoading, refetch }) => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const { quantity, price, category, name, _id, seller } = plant || {};
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(price);
  const navigate = useNavigate();

  const [purchaseInfo, setPurchaseInfo] = useState({
    customer: {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL,
    },
    plantId: _id,
    price: totalPrice,
    quantity: totalQuantity,
    seller: seller?.email,
    address: "",
    status: "pending",
  });

  // controlled purchease modal
  const handelTotalQuantity = (value) => {
    if (value > quantity) {
      setTotalQuantity(quantity);
      return toast.error("Quantity exceeds availabel quantity");
    }
    if (value < 0) {
      setTotalQuantity(1);
      return toast.error("Quantity cannot be less then 1");
    }
    setTotalQuantity(value);
    setTotalPrice(value * price);
    setPurchaseInfo((prv) => {
      return { ...prv, quantity: value, price: value * price };
    });
  };

  const handelPurchase = async () => {
    try {
      await axiosSecure.post("/orders", purchaseInfo);

      // decrease quantity from plant collection
      await axiosSecure.patch(`/plants/quantity/${_id}`, {
        quantityToUpdate: totalQuantity,
        status: "decrease",
      });
      toast.success("purchase successful!");
      navigate("/dashboard/my-orders");
      refetch();
    } catch (err) {
      console.log(err);
    } finally {
      closeModal();
    }
  };
  if (isLoading) return <LoadingSpinner />;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Plant: {name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Category: {category}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Price: $ {price}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Available Quantity: {quantity}
                  </p>
                  <div>
                    {/* Quantity */}
                    <div className="space-x-3 text-sm mt-2">
                      <label htmlFor="quantity" className=" text-gray-600">
                        Quantity:
                      </label>
                      <input
                        value={totalQuantity}
                        onChange={(e) =>
                          handelTotalQuantity(parseInt(e.target.value))
                        }
                        className=" p-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                        name="quantity"
                        id="quantity"
                        type="number"
                        placeholder="Available quantity"
                        required
                      />
                    </div>

                    {/* address */}
                    <div className="space-x-3 text-sm mt-2">
                      <label htmlFor="address" className=" text-gray-600">
                        Address:
                      </label>
                      <input
                        onChange={(e) =>
                          setPurchaseInfo((prv) => {
                            return { ...prv, address: e.target.value };
                          })
                        }
                        className=" p-2 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                        name="address"
                        id="address"
                        type="text"
                        placeholder="shipping address..."
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      onClick={handelPurchase}
                      label={`Pay ${totalPrice}$`}
                    ></Button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;
