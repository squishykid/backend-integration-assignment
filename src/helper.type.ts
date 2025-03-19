import { AxiosError } from "axios";

export enum Outcome {
  Success,
  Error,
}

type SuccessResult<T> = {
  result: Outcome.Success;
  data: T;
};

type ErrorResult = {
  result: Outcome.Error;
  error: Error | unknown;
};

export type Result<T> = SuccessResult<T> | ErrorResult;

export const isOk = <T>(res: Result<T>): res is SuccessResult<T> => {
  return res.result == Outcome.Success
}

export const isErr = <T>(res: Result<T>): res is ErrorResult => {
  return res.result == Outcome.Error
}