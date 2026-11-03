import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/product.model.js", () => ({
  Product: {
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("../models/category.model.js", () => ({
  Category: {
    distinct: vi.fn(),
    findOne: vi.fn(),
  },
  slugify: vi.fn(),
}));

import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { getProducts } from "./product.controller.js";

const categoryId = "507f1f77bcf86cd799439011";

const createResponse = () => {
  const res: any = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
};

const createRequest = (query: Record<string, any> = {}) =>
  ({
    query,
    params: {},
    body: {},
  }) as any;

const createNext = () => vi.fn();

const createProductQuery = (products: any[]) => {
  const query: any = {
    populate: vi.fn(),
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
  };

  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockResolvedValue(products);

  return query;
};

describe("Product controller - getProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(Category.distinct).mockResolvedValue([categoryId] as never);

    vi.mocked(Product.countDocuments).mockResolvedValue(3 as never);
  });

  it("returns products using newest-first sorting by default", async () => {
    const products = [{ _id: "product-1" }];
    const query = createProductQuery(products);

    vi.mocked(Product.find).mockReturnValue(query as never);

    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(Product.find).toHaveBeenCalledWith({
      isActive: true,
      category: { $in: [categoryId] },
    });

    expect(query.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: 1,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 1,
        totalProducts: 3,
        totalPages: 1,
        currentPage: 1,
        products,
      }),
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("sorts products by effective price in ascending order", async () => {
    const ids = ["product-1", "product-2"];

    const products = [{ _id: "product-2" }, { _id: "product-1" }];

    vi.mocked(Product.aggregate).mockResolvedValue(
      ids.map((_id) => ({ _id })) as never,
    );

    const query = {
      populate: vi.fn().mockResolvedValue(products),
    };

    vi.mocked(Product.find).mockReturnValue(query as never);

    const req = createRequest({ sort: "price-asc" });
    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(Product.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $sort: {
            effectivePrice: 1,
            _id: 1,
          },
        }),
      ]),
    );

    expect(Product.find).toHaveBeenCalledWith({
      _id: { $in: ids },
    });

    const response = res.json.mock.calls[0][0];

    expect(response.products).toEqual([products[1], products[0]]);
  });

  it("sorts products by effective price in descending order", async () => {
    vi.mocked(Product.aggregate).mockResolvedValue([
      { _id: "product-1" },
    ] as never);

    const query = {
      populate: vi.fn().mockResolvedValue([{ _id: "product-1" }]),
    };

    vi.mocked(Product.find).mockReturnValue(query as never);

    const req = createRequest({ sort: "price-desc" });
    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(Product.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $sort: {
            effectivePrice: -1,
            _id: 1,
          },
        }),
      ]),
    );
  });

  it("applies pagination before fetching sorted products", async () => {
    vi.mocked(Product.aggregate).mockResolvedValue([
      { _id: "product-3" },
    ] as never);

    const query = {
      populate: vi.fn().mockResolvedValue([{ _id: "product-3" }]),
    };

    vi.mocked(Product.find).mockReturnValue(query as never);

    const req = createRequest({
      sort: "price-asc",
      page: "2",
      limit: "1",
    });

    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    const pipeline = vi.mocked(Product.aggregate).mock.calls[0][0];

    expect(pipeline).toContainEqual({ $skip: 1 });
    expect(pipeline).toContainEqual({ $limit: 1 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 2,
        totalPages: 3,
      }),
    );
  });

  it("filters products by in-stock availability", async () => {
    const query = createProductQuery([]);

    vi.mocked(Product.find).mockReturnValue(query as never);

    const req = createRequest({ inStock: "true" });
    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(Product.find).toHaveBeenCalledWith(
      expect.objectContaining({
        stock: { $gt: 0 },
      }),
    );
  });

  it("rejects negative minimum prices", async () => {
    const req = createRequest({ minPrice: "-100" });
    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Product.countDocuments).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects minimum price greater than maximum price", async () => {
    const req = createRequest({
      minPrice: "5000",
      maxPrice: "1000",
    });

    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Product.countDocuments).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    const error = new Error("Database unavailable");

    vi.mocked(Category.distinct).mockRejectedValue(error);

    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    await getProducts(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
