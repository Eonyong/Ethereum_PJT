import React, { useEffect, useState } from "react";
import {
  Flex,
  Text,
  Button,
  Box,
  Image,
  Modal,
  ModalOverlay,
  useDisclosure,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  useToast,
} from "@chakra-ui/react";
import { mintProductContract, saleProductContract, web3 } from "../web3Config";
import ModalContentBody from "./ModalContentBody";
import axios from "axios";

const SaleProductCard = ({
  productTokenId,
  brand,
  productType,
  name,
  serialNum,
  productPrice,
  account,
  getOnSaleProducts,
}) => {
  const [isBuyable, setIsBuyable] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dealHistories, setDealHistories] = useState([]);
  const [picture, setPicture] = useState([]);
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const getProductOwner = async () => {
    try {
      const response = await mintProductContract.methods
        .ownerOf(productTokenId)
        .call();

      setIsBuyable(
        response.toLocaleLowerCase() === account.toLocaleLowerCase()
      );
      if (response) {
        setOwner(response.toLocaleLowerCase());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getDealHistories = async () => {
    const histories = await saleProductContract.methods
      .getDealHistories(productTokenId)
      .call();

    setDealHistories(histories);
  };

  const onClickCancel = async () => {
    try {
      if (!account) return;
      setLoading(true);
      await saleProductContract.methods
        .cancelSaleProduct(productTokenId)
        .send({ from: account });

      window.location.reload();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const onClickBuy = async () => {
    try {
      if (!account) return;
      setLoading(true);
      const response = await saleProductContract.methods
        .purchaseProduct(productTokenId)
        .send({ from: account, value: productPrice });

      if (response.status) {
        getOnSaleProducts();
        toast({
          title: "거래 정보",
          description: "구매가 완료 되었습니다.",
          status: "warning",
          duration: 2000,
        });
      } else {
        toast({
          title: "거래 정보",
          description: "구매에 실패했습니다.",
          status: "error",
          duration: 2000,
        });
      }
    } catch {
      toast({
        title: "거래 정보",
        description: "구매에 실패했습니다.",
        status: "error",
        duration: 2000,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!productTokenId) return;
    getDealHistories();
    getProductOwner();

    axios
      .get("http://j6a507.p.ssafy.io:8080/user/picture", {
        params: {
          id: productTokenId,
        },
      })
      .then((res) => {
        setPicture(res.data.data.picture_url);
      });
  }, [productTokenId]);

  return (
    <Box
      textAlign="center"
      borderWidth="1px"
      boxShadow="dark-lg"
      w={250}
      p={5}
      m={5}
    >
      <>
        <Image w={150} h={150} src={picture} alt="ProductCard" m="auto" />
        <Text fontSize="sm" color="gray">
          {brand}
        </Text>
        <Text fontSize="lg" fontWeight="extrabold">
          {name}
        </Text>
        <Text d="inline-block">{web3.utils.fromWei(productPrice)} ETH</Text>

        <Flex
          justify="center"
          m="auto"
          mt="5"
          width="80%"
          flexDirection="column"
        >
          <Button
            onClick={onOpen}
            colorScheme="whatsapp"
            width="80%"
            m="auto"
            mb="3"
          >
            상세정보
          </Button>

          {isBuyable ? (
            <Button
              colorScheme="red"
              width="80%"
              m="auto"
              onClick={onClickCancel}
              loadingText="판매 취소중"
              spinnerPlacement="start"
              isLoading={loading}
            >
              판매 취소
            </Button>
          ) : (
            <Button
              colorScheme="purple"
              width="80%"
              m="auto"
              onClick={onClickBuy}
              loadingText="구매중"
              spinnerPlacement="start"
              isLoading={loading}
            >
              구매
            </Button>
          )}
        </Flex>
      </>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        motionPreset="slideInBottom"
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>제품 정보</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ModalContentBody
              productTokenId={productTokenId}
              brand={brand}
              name={name}
              productType={productType}
              serialNum={serialNum}
              account={owner}
              saleHistory={dealHistories}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SaleProductCard;
