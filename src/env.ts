type EnvironmentType =
  | "content-script"
  | "service-worker"
  | "popup"
  | "options";

class Environment {
  public type: EnvironmentType | undefined;

  public setType(type: EnvironmentType): void {
    this.type = type;
  }

  private requireType(): EnvironmentType {
    if (!this.type) {
      throw new Error("Environment type not set");
    }
    return this.type;
  }

  public canPromptAuth(): boolean {
    const type = this.requireType();
    switch (type) {
      case "content-script": {
        return false;
      }
      case "service-worker":
      case "popup":
      case "options": {
        return true;
      }
    }
  }
}

export const env = new Environment();

export function setEnvironment(type: EnvironmentType): void {
  env.setType(type);
}
