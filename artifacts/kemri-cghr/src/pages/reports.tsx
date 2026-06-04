import { useGetDataQualityReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle, AlertTriangle } from "lucide-react";

function IssueList({ title, ids, description }: { title: string; ids?: string[]; description: string }) {
  const count = ids?.length ?? 0;
  return (
    <Card className={`border-2 ${count > 0 ? "border-yellow-400/50" : "border-green-400/40"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {count === 0 ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              {count} issue{count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-xs text-green-600 font-medium">No issues found</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ids?.map(id => (
              <Link key={id} href={`/screening/${id}`}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted">
                  {id}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { data: report, isLoading } = useGetDataQualityReport();

  const totalIssues = report
    ? Object.values(report).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Data Quality Report</h1>
          <p className="text-muted-foreground">Identify and resolve missing or anomalous data</p>
        </div>
        {!isLoading && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${totalIssues === 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
            {totalIssues === 0 ? (
              <><CheckCircle className="w-4 h-4" /> All checks passed</>
            ) : (
              <><AlertTriangle className="w-4 h-4" /> {totalIssues} total issue{totalIssues !== 1 ? "s" : ""}</>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IssueList
            title="Missing Date of Birth"
            ids={report?.missingDob}
            description="Screening records with no DOB entered"
          />
          <IssueList
            title="Missing Weight"
            ids={report?.missingWeight}
            description="Records with no weight measurement"
          />
          <IssueList
            title="Missing Blood Pressure"
            ids={report?.missingBp}
            description="Records with no BP recorded"
          />
          <IssueList
            title="BMI Below 15"
            ids={report?.bmiUnder15}
            description="Participants with abnormally low BMI"
          />
          <IssueList
            title="BMI Above 45"
            ids={report?.bmiOver45}
            description="Participants with abnormally high BMI"
          />
          <IssueList
            title="Missing Consent"
            ids={report?.missingConsent}
            description="Eligible participants without consent recorded"
          />
          <IssueList
            title="Missing Delivery Date"
            ids={report?.missingDeliveryDate}
            description="Delivery records with no date entered"
          />
        </div>
      )}
    </div>
  );
}
