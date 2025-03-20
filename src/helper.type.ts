export enum Outcome {
  Success,
  Error,
}

export type SuccessResult<T> = {
  result: Outcome.Success;
  data: T;
};

export type ErrorResult = {
  result: Outcome.Error;
  error: Error | unknown;
};

export type Result<T> = SuccessResult<T> | ErrorResult;

export const isOk = <T>(res: Result<T>): res is SuccessResult<T> => {
  return res.result == Outcome.Success;
};

export const isErr = <T>(res: Result<T>): res is ErrorResult => {
  return res.result == Outcome.Error;
};

export const ok = <T>(data: T): SuccessResult<T> => ({
  result: Outcome.Success,
  data: data,
});

export const err = (error: Error | unknown): ErrorResult => ({
  result: Outcome.Error,
  error,
});
