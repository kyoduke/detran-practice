import { test, expect } from "@playwright/test";

test("fluxo completo de simulado: 30 questões até o resultado", async ({
  page,
}) => {
  await page.goto("/");

  // Aguarda a home carregar
  await expect(
    page.getByRole("heading", { name: /escolha seu treino/i }),
  ).toBeVisible();

  // Inicia o simulado de 30 questões
  await page.getByRole("button", { name: /simulado de 30 questões/i }).click();

  // Responde 30 questões
  for (let i = 0; i < 30; i++) {
    // Aguarda a questão aparecer (botão Confirmar visível)
    const confirmBtn = page.getByRole("button", { name: /^confirmar$/i });
    await expect(confirmBtn).toBeVisible();

    // Seleciona a primeira alternativa (dentro do card de questão)
    // As alternativas são botões com um div filho contendo apenas a letra
    const questionCard = page.locator(".flex.flex-col.gap-2\\.5").first();
    const firstAnswer = questionCard.locator("button").first();
    await firstAnswer.click();

    // Clica em Confirmar
    await confirmBtn.click();

    // Aguarda o estado pós-confirmação
    const nextBtn = page.getByRole("button", { name: /^próxima$/i });
    const resultBtn = page.getByRole("button", { name: /^ver resultado$/i });

    if (i < 29) {
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
    } else {
      await expect(resultBtn).toBeVisible();
      await resultBtn.click();
    }
  }

  // Verifica a tela de resultado
  await expect(
    page.getByRole("heading", { name: /você acertou/i }),
  ).toBeVisible();

  await expect(page.getByText("acertos")).toBeVisible();
  await expect(page.getByText("erros")).toBeVisible();
  await expect(page.getByText("aproveitamento", { exact: true })).toBeVisible();

  // Verifica os botões de ação
  await expect(
    page.getByRole("button", { name: /refazer simulado/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /revisar respostas/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /voltar ao início/i }),
  ).toBeVisible();
});
