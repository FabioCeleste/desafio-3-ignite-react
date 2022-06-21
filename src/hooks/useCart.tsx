import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get("/stock");
      const response = await api.get("/products");
      const productFind: Product = response.data.find((item: any) => {
        return item.id == productId;
      });

      const sameProductInCart = cart.find((cartItem) => {
        if (cartItem.id == productId) {
          return cartItem;
        }
      });

      const stockProduct = data.find((stockItem: any) => {
        if (stockItem.id == productId) {
          return stockItem;
        }
      });

      let newCart: Product[] = [];

      if (sameProductInCart) {
        if (stockProduct.amount < sameProductInCart.amount + 1) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        newCart = cart.filter((cartItem) => {
          if (cartItem.id !== productId) {
            return cartItem;
          }
        });

        sameProductInCart.amount++;

        newCart.push(sameProductInCart);
      } else {
        productFind.amount = 1;
        newCart = [...cart, productFind];
      }

      setCart(newCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const newCart = cart.filter((cartItem) => {
        if (cartItem.id !== productId) {
          return cartItem;
        }
      });
      setCart(newCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get("/products");
      const productFind: Product = response.data.find((item: any) => {
        return item.id == productId;
      });
      const sameProductInCart = cart.find((cartItem) => {
        if (cartItem.id == productId) {
          return cartItem;
        }
      });

      let newCart: Product[] = [];

      if (sameProductInCart) {
        newCart = cart.filter((cartItem) => {
          if (cartItem.id !== productId) {
            return cartItem;
          }
        });

        sameProductInCart.amount += amount;

        newCart.push(sameProductInCart);
      } else {
        newCart = cart.filter((itemCart) => {
          if (itemCart.id !== productId) {
            return itemCart;
          }
        });
        setCart(newCart);
      }

      setCart(newCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
