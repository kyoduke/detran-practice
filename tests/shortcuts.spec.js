import { test, expect } from "@playwright/test";

async function startOfficial30(page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /escolha seu treino/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /simulado de 30 questões/i })
    .click();
}

async function dismissPopup(page) {
  await expect(
    page.getByRole("button", { name: /^entendi, começar$/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^entendi, começar$/i }).click();
}

async function answerCurrentQuestion(page, selectKey) {
  await page.keyboard.press(selectKey);
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /^(próxima|ver resultado)$/i }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
}

test("alternativas são numeradas de 1 a 4 e o controle de sair não usa seta esquerda", async ({
  page,
}) => {
  await startOfficial30(page);
  await dismissPopup(page);

  await expect(page.getByRole("button", { name: /^1 / })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^2 / })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^3 / })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^4 / })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^[A-D] / })).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: /^sair da sessão$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^voltar para escolha de sessão$/i }),
  ).toHaveCount(0);
});

test("sessão completa navegando apenas pelo teclado", async ({ page }) => {
  await startOfficial30(page);
  await dismissPopup(page);

  for (let i = 0; i < 30; i++) {
    await answerCurrentQuestion(page, String((i % 4) + 1));
    if (i < 29) {
      await expect(
        page.getByRole("button", { name: /^confirmar$/i }),
      ).toBeVisible();
    }
  }

  await expect(
    page.getByRole("heading", { name: /você acertou/i }),
  ).toBeVisible();
});

test("tecla repetida e modificadores são ignorados", async ({ page }) => {
  await startOfficial30(page);
  await dismissPopup(page);

  await page.keyboard.press("1");

  await page.evaluate(() => {
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", repeat: true, bubbles: true }),
    );
  });
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();

  await page.evaluate(() => {
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        ctrlKey: true,
        bubbles: true,
      }),
    );
  });
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();
});

test("navegação para trás mostra a resposta travada", async ({ page }) => {
  await startOfficial30(page);
  await dismissPopup(page);

  await answerCurrentQuestion(page, "1");
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();
  await answerCurrentQuestion(page, "2");
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();

  await expect(page.getByText(/^Questão 3 de 30$/)).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText(/^Questão 2 de 30$/)).toBeVisible();

  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^(próxima|ver resultado)$/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/^(resposta correta|resposta incorreta)$/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^2 / }),
  ).toBeDisabled();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText(/^Questão 1 de 30$/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^anterior$/i }),
  ).toBeDisabled();

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText(/^Questão 1 de 30$/)).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/^Questão 2 de 30$/)).toBeVisible();
});

test("popup aparece na primeira questão e 'Entendi, começar' dispensa só a sessão", async ({
  page,
}) => {
  await startOfficial30(page);
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeVisible();

  await dismissPopup(page);
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeHidden();

  await answerCurrentQuestion(page, "1");
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");

  await startOfficial30(page);
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeVisible();
});

test("'Não mostrar novamente' persiste e o '?' reabre a qualquer momento", async ({
  page,
}) => {
  await startOfficial30(page);
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^não mostrar novamente$/i })
    .click();
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeHidden();

  await answerCurrentQuestion(page, "1");
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");

  await startOfficial30(page);
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeHidden();

  await page.getByRole("button", { name: /atalhos de teclado/i }).click();
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeVisible();
});

test("resetar progresso não re-habilita o popup", async ({ page }) => {
  await startOfficial30(page);
  await page
    .getByRole("button", { name: /^não mostrar novamente$/i })
    .click();

  page.on("dialog", (dialog) => dialog.accept());
  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("heading", { name: /escolha seu treino/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /resetar progresso/i }).click();
  await expect(
    page.getByRole("heading", { name: /escolha seu treino/i }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /simulado de 30 questões/i })
    .click();
  await expect(
    page.getByRole("dialog", { name: /atalhos de teclado/i }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: /^confirmar$/i }),
  ).toBeVisible();
});
